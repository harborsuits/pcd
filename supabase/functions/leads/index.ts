import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Find "leads" in path and get remaining segments
  const leadsIdx = pathParts.lastIndexOf("leads");
  const subPath = leadsIdx >= 0 ? pathParts.slice(leadsIdx + 1).join("/") : "";

  console.log(`Leads endpoint called: ${subPath}, method: ${req.method}`);

  // Route: POST /leads/search
  if (subPath === "search" && req.method === "POST") {
    return handleSearch(req);
  }

  // Route: GET /leads (list leads)
  if (subPath === "" && req.method === "GET") {
    return handleListLeads(req);
  }

  // Route: PATCH /leads/:id (update lead status)
  if (subPath && req.method === "PATCH") {
    return handleUpdateLead(req, subPath);
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Validate admin key helper
function validateAdminKey(req: Request): Response | null {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = Deno.env.get("ADMIN_KEY");

  if (!expectedKey) {
    console.error("ADMIN_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!adminKey || adminKey !== expectedKey) {
    console.log("Invalid or missing admin key");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null; // Valid
}

// Get Supabase client helper
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Compute lead score and reasons
function computeLeadScore(place: {
  website?: string;
  phone?: string;
  business_status?: string;
}): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // No website = high priority
  if (!place.website) {
    score += 70;
    reasons.push("no_website");
  } else {
    score += 10;
    reasons.push("has_website");
  }

  // No phone = penalty
  if (!place.phone) {
    score -= 40;
    reasons.push("no_phone");
  } else {
    score += 20;
    reasons.push("has_phone");
  }

  // Business is operational
  if (place.business_status === "OPERATIONAL") {
    score += 10;
    reasons.push("operational");
  }

  return { score, reasons };
}

// POST /leads/search - Search Google Places and upsert leads
async function handleSearch(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    let body: { query?: string; location?: string; radius_m?: number };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query, location, radius_m = 15000 } = body;

    if (!query || !location) {
      return new Response(
        JSON.stringify({ error: "query and location are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Google Places API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching for "${query}" near "${location}" (radius: ${radius_m}m)`);

    // Step 1: Geocode the location to get lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not geocode location", details: geocodeData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log(`Geocoded to: ${lat}, ${lng}`);

    // Step 2: Text Search for businesses (with pagination - up to 3 pages)
    let allPlaces: Array<{ place_id: string; name: string }> = [];
    let nextPageToken: string | null = null;
    const maxPages = 3;

    for (let page = 0; page < maxPages; page++) {
      let textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius_m}&key=${apiKey}`;
      
      if (nextPageToken) {
        // Google requires ~2 second delay before using next_page_token
        await new Promise(resolve => setTimeout(resolve, 2000));
        textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
      }

      const searchRes = await fetch(textSearchUrl);
      const searchData = await searchRes.json();

      if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
        if (page === 0) {
          console.error("Places API error:", searchData);
          return new Response(
            JSON.stringify({ error: "Google Places API error", details: searchData.status }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        break; // Later pages may fail, that's ok
      }

      const places = searchData.results || [];
      allPlaces = allPlaces.concat(places);
      console.log(`Page ${page + 1}: Found ${places.length} places (total: ${allPlaces.length})`);

      nextPageToken = searchData.next_page_token || null;
      if (!nextPageToken) break;
    }

    console.log(`Total places found: ${allPlaces.length}`);

    // Step 3: Get details for each place and upsert leads
    const supabase = getSupabaseClient();
    const leads: Array<{
      id: string;
      place_id: string;
      business_name: string;
      phone: string | null;
      website: string | null;
      address: string | null;
      category: string | null;
      lat: number;
      lng: number;
      lead_score: number;
      lead_reasons: string[];
    }> = [];

    for (const place of allPlaces) {
      try {
        // Get place details
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,geometry,types,business_status&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== "OK") {
          console.log(`Skipping ${place.name}: ${detailsData.status}`);
          continue;
        }

        const detail = detailsData.result;
        const { score, reasons } = computeLeadScore({
          website: detail.website,
          phone: detail.formatted_phone_number,
          business_status: detail.business_status,
        });

        // Extract primary category from types
        const category = detail.types?.[0]?.replace(/_/g, " ") || null;

        // Upsert lead by place_id
        const { data: lead, error: upsertError } = await supabase
          .from("leads")
          .upsert({
            place_id: place.place_id,
            source: "google_places",
            query_term: query,
            location_text: location,
            radius_m: radius_m,
            business_name: detail.name,
            phone: detail.formatted_phone_number || null,
            website: detail.website || null,
            address: detail.formatted_address || null,
            category: category,
            lat: detail.geometry?.location?.lat,
            lng: detail.geometry?.location?.lng,
            lead_score: score,
            lead_reasons: reasons,
          }, { onConflict: "place_id" })
          .select("id, place_id, business_name, phone, website, address, category, lat, lng, lead_score, lead_reasons")
          .single();

        if (upsertError) {
          console.error(`Upsert error for ${detail.name}:`, upsertError);
          continue;
        }

        if (lead) {
          leads.push(lead);
        }
      } catch (err) {
        console.error(`Error processing place ${place.name}:`, err);
      }
    }

    // Step 4: Log the search run
    const { data: searchRun, error: runError } = await supabase
      .from("lead_search_runs")
      .insert({
        query_term: query,
        location_text: location,
        radius_m: radius_m,
        results_count: leads.length,
        provider: "google_places",
        raw_meta: {
          geocode_result: geocodeData.results[0],
          total_found: allPlaces.length,
          pages_fetched: Math.min(maxPages, Math.ceil(allPlaces.length / 20)),
        },
      })
      .select("id")
      .single();

    if (runError) {
      console.error("Failed to log search run:", runError);
    }

    console.log(`Search complete: ${leads.length} leads upserted`);

    return new Response(
      JSON.stringify({
        run_id: searchRun?.id || null,
        results: leads,
        total_found: allPlaces.length,
        processed: leads.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /leads - List leads with optional filters
async function handleListLeads(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const noWebsiteOnly = url.searchParams.get("no_website") === "true";
    const minScore = parseInt(url.searchParams.get("min_score") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const supabase = getSupabaseClient();

    let query = supabase
      .from("leads")
      .select("id, place_id, business_name, phone, website, address, category, lat, lng, lead_score, lead_reasons, demo_status, outreach_status, created_at")
      .gte("lead_score", minScore)
      .order("lead_score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (noWebsiteOnly) {
      query = query.is("website", null);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error("List leads error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ leads: leads || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("List leads error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /leads/:id - Update lead status (skip, etc.)
async function handleUpdateLead(req: Request, leadId: string): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    let body: { outreach_status?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { outreach_status } = body;

    if (!outreach_status) {
      return new Response(
        JSON.stringify({ error: "outreach_status is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validStatuses = ["new", "queued", "sent", "replied", "opted_out", "skip"];
    if (!validStatuses.includes(outreach_status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    const { data: lead, error } = await supabase
      .from("leads")
      .update({ outreach_status })
      .eq("id", leadId)
      .select("id, outreach_status")
      .single();

    if (error) {
      console.error("Update lead error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update lead" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, lead }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update lead error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
