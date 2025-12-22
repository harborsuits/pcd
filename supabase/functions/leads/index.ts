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

  // Route: POST /leads/search (admin only)
  if (subPath === "search" && req.method === "POST") {
    return handleSearch(req);
  }

  // Route: POST /leads/search-and-generate (admin only) - Full pipeline
  if (subPath === "search-and-generate" && req.method === "POST") {
    return handleSearchAndGenerate(req);
  }

  // Route: POST /leads/request-demo (public - for lead capture)
  if (subPath === "request-demo" && req.method === "POST") {
    return handleRequestDemo(req);
  }

  // Route: GET /leads (list leads)
  if (subPath === "" && req.method === "GET") {
    return handleListLeads(req);
  }

  // Route: POST /leads/:id/generate-demo
  if (subPath.endsWith("/generate-demo") && req.method === "POST") {
    const leadId = subPath.replace("/generate-demo", "");
    return handleGenerateDemo(req, leadId);
  }

  // Route: POST /leads/clear-demos (admin only - delete all leads with demos)
  if (subPath === "clear-demos" && req.method === "POST") {
    return handleClearDemos(req);
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

// Normalize location string for better geocoding
function normalizeLocation(raw: string): string {
  return (raw || "").trim().replace(/\s+/g, " ");
}

// Check if location looks like a county
function isCountyLocation(location: string): boolean {
  const lower = location.toLowerCase();
  return lower.includes("county") || lower.includes(" co,") || lower.includes(" co ");
}

// Geocode result type - supports both point and viewport
interface GeoResult {
  lat: number;
  lng: number;
  method: string;
  isCounty: boolean;
  viewport?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

// Geocoding error type for better error handling
interface GeoError {
  type: "api_denied" | "not_found" | "unknown";
  message: string;
}

// Try geocoding with fallback - returns lat/lng and viewport for counties
async function geocodeWithFallback(
  location: string,
  query: string,
  apiKey: string
): Promise<{ result: GeoResult } | { error: GeoError }> {
  const normalizedLoc = normalizeLocation(location);
  const isCounty = isCountyLocation(normalizedLoc);
  
  // First try: standard geocoding
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalizedLoc)}&key=${apiKey}`;
  const geocodeRes = await fetch(geocodeUrl);
  const geocodeData = await geocodeRes.json();
  
  console.log(`Geocode attempt for "${normalizedLoc}": status=${geocodeData.status}, results=${geocodeData.results?.length || 0}, isCounty=${isCounty}`);
  
  // Check for API key issues first
  if (geocodeData.status === "REQUEST_DENIED") {
    console.error("Geocoding API denied:", geocodeData.error_message);
    return { 
      error: { 
        type: "api_denied", 
        message: `Google API error: ${geocodeData.error_message || "REQUEST_DENIED"}. Check that Geocoding API is enabled and API key has no IP restrictions.` 
      } 
    };
  }
  
  if (geocodeData.status === "OK" && geocodeData.results?.length > 0) {
    const geometry = geocodeData.results[0].geometry;
    const loc = geometry?.location;
    const viewport = geometry?.viewport;
    
    if (loc?.lat && loc?.lng) {
      return { 
        result: { 
          lat: loc.lat, 
          lng: loc.lng, 
          method: "geocode",
          isCounty,
          viewport: viewport ? {
            northeast: { lat: viewport.northeast.lat, lng: viewport.northeast.lng },
            southwest: { lat: viewport.southwest.lat, lng: viewport.southwest.lng }
          } : undefined
        }
      };
    }
  }
  
  // Fallback: try Places Text Search to extract location from first result
  console.log(`Geocoding failed, trying Places Text Search fallback for "${query} in ${normalizedLoc}"`);
  const fallbackQuery = `${query} in ${normalizedLoc}`;
  const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fallbackQuery)}&key=${apiKey}`;
  const searchRes = await fetch(textSearchUrl);
  const searchData = await searchRes.json();
  
  console.log(`Places fallback for "${fallbackQuery}": status=${searchData.status}, results=${searchData.results?.length || 0}`);
  
  // Check for API key issues in fallback
  if (searchData.status === "REQUEST_DENIED") {
    console.error("Places API denied:", searchData.error_message);
    return { 
      error: { 
        type: "api_denied", 
        message: `Google API error: ${searchData.error_message || "REQUEST_DENIED"}. Check that Places API is enabled and API key has no IP restrictions.` 
      } 
    };
  }
  
  if (searchData.status === "OK" && searchData.results?.length > 0) {
    const firstResult = searchData.results[0];
    const loc = firstResult.geometry?.location;
    if (loc?.lat && loc?.lng) {
      return { result: { lat: loc.lat, lng: loc.lng, method: "places_fallback", isCounty } };
    }
  }
  
  return { 
    error: { 
      type: "not_found", 
      message: "Could not understand that location. Try 'City, ST' format (e.g., 'Portland, ME' or 'Lincoln County, ME')." 
    } 
  };
}

// Generate grid points to cover a viewport (for county searches)
function generateGridPoints(
  viewport: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } },
  gridSize: number = 3
): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  const latStep = (viewport.northeast.lat - viewport.southwest.lat) / gridSize;
  const lngStep = (viewport.northeast.lng - viewport.southwest.lng) / gridSize;
  
  // Generate points in a grid pattern
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      points.push({
        lat: viewport.southwest.lat + latStep * (i + 0.5),
        lng: viewport.southwest.lng + lngStep * (j + 0.5)
      });
    }
  }
  
  console.log(`Generated ${points.length} grid points to cover viewport`);
  return points;
}

// Calculate appropriate radius for grid search based on viewport size
function calculateGridRadius(
  viewport: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } },
  gridSize: number = 3
): number {
  // Approximate distance in meters using Haversine-like calculation
  const latDiff = Math.abs(viewport.northeast.lat - viewport.southwest.lat);
  const lngDiff = Math.abs(viewport.northeast.lng - viewport.southwest.lng);
  
  // Rough conversion: 1 degree lat ≈ 111km, 1 degree lng ≈ 85km (at mid-latitudes)
  const heightKm = latDiff * 111;
  const widthKm = lngDiff * 85;
  
  // Grid cell diagonal should be covered by radius
  const cellDiagonalKm = Math.sqrt(Math.pow(heightKm / gridSize, 2) + Math.pow(widthKm / gridSize, 2));
  const radiusM = Math.min(Math.ceil(cellDiagonalKm * 1000 * 0.75), 50000); // Cap at 50km
  
  console.log(`Viewport size: ~${heightKm.toFixed(1)}km x ${widthKm.toFixed(1)}km, grid radius: ${radiusM}m`);
  return radiusM;
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

    // Step 1: Geocode the location with fallback
    const geoResult = await geocodeWithFallback(location, query, apiKey);
    
    if ("error" in geoResult) {
      const statusCode = geoResult.error.type === "api_denied" ? 500 : 400;
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: geoResult.error.message
        }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng, method } = geoResult.result;
    console.log(`Geocoded to: ${lat}, ${lng} (method: ${method})`);

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
      phone_raw: string | null;
      phone_e164: string | null;
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
        // Get place details - include international_phone_number for better phone data
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,geometry,types,business_status&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== "OK") {
          console.log(`Skipping ${place.name}: ${detailsData.status}`);
          continue;
        }

        const detail = detailsData.result;
        
        // Phone normalization logic
        const phoneRaw = detail.international_phone_number || detail.formatted_phone_number || null;
        let phoneE164: string | null = null;
        
        if (phoneRaw) {
          // Try to normalize to E.164
          const digitsOnly = phoneRaw.replace(/\D/g, "");
          
          if (phoneRaw.startsWith("+")) {
            // Already has country code, strip spaces
            phoneE164 = phoneRaw.replace(/\s+/g, "");
          } else if (digitsOnly.length === 10) {
            // US number assumption (10 digits)
            phoneE164 = `+1${digitsOnly}`;
          } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
            // US number with leading 1
            phoneE164 = `+${digitsOnly}`;
          }
          // Otherwise phoneE164 stays null, we keep phone_raw
        }
        
        // Best phone = E.164 if available, else raw
        const bestPhone = phoneE164 || phoneRaw;
        
        const { score, reasons } = computeLeadScore({
          website: detail.website,
          phone: bestPhone,
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
            phone: bestPhone,
            phone_raw: phoneRaw,
            phone_e164: phoneE164,
            website: detail.website || null,
            address: detail.formatted_address || null,
            category: category,
            lat: detail.geometry?.location?.lat,
            lng: detail.geometry?.location?.lng,
            lead_score: score,
            lead_reasons: reasons,
          }, { onConflict: "place_id" })
          .select("id, place_id, business_name, phone, phone_raw, phone_e164, website, address, category, lat, lng, lead_score, lead_reasons")
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
          geocode_method: method,
          geocode_center: { lat, lng },
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

// POST /leads/search-and-generate - Full pipeline: search → filter no-website → enrich → generate demos
async function handleSearchAndGenerate(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    let body: { 
      query?: string; 
      location?: string; 
      radius_m?: number;
      max_demos?: number;
      queue_outreach?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query, location, radius_m = 15000, max_demos = 20, queue_outreach = false } = body;

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

    console.log(`Search-and-generate: "${query}" near "${location}" (max ${max_demos} demos)`);

    // Step 1: Geocode the location with fallback
    const geoResult = await geocodeWithFallback(location, query, apiKey);
    
    if ("error" in geoResult) {
      const statusCode = geoResult.error.type === "api_denied" ? 500 : 400;
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: geoResult.error.message
        }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng, method, isCounty, viewport } = geoResult.result;
    console.log(`Geocoded to: ${lat}, ${lng} (method: ${method}, isCounty: ${isCounty})`);

    // Step 2: Text Search - different strategies for city vs county
    let allPlaces: Array<{ place_id: string; name: string }> = [];
    const seenPlaceIds = new Set<string>();

    if (isCounty && viewport) {
      // COUNTY SEARCH: Use grid-based approach to cover the entire area
      const gridPoints = generateGridPoints(viewport, 3); // 3x3 = 9 search points
      const gridRadius = calculateGridRadius(viewport, 3);
      
      console.log(`County search: ${gridPoints.length} grid points, radius ${gridRadius}m`);
      
      for (const point of gridPoints) {
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${point.lat},${point.lng}&radius=${gridRadius}&key=${apiKey}`;
        const searchRes = await fetch(textSearchUrl);
        const searchData = await searchRes.json();
        
        if (searchData.status === "OK") {
          const places = searchData.results || [];
          for (const place of places) {
            if (!seenPlaceIds.has(place.place_id)) {
              seenPlaceIds.add(place.place_id);
              allPlaces.push(place);
            }
          }
          console.log(`Grid point (${point.lat.toFixed(3)}, ${point.lng.toFixed(3)}): ${places.length} results, ${allPlaces.length} unique total`);
        }
        
        // Small delay between grid searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      // CITY/POINT SEARCH: Standard radius-based search with pagination
      let nextPageToken: string | null = null;
      const maxPages = 3;

      for (let page = 0; page < maxPages; page++) {
        let textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius_m}&key=${apiKey}`;
        
        if (nextPageToken) {
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
          break;
        }

        const places = searchData.results || [];
        allPlaces = allPlaces.concat(places);
        console.log(`Page ${page + 1}: Found ${places.length} places (total: ${allPlaces.length})`);

        nextPageToken = searchData.next_page_token || null;
        if (!nextPageToken) break;
      }
    }

    console.log(`Total unique places found: ${allPlaces.length} (search type: ${isCounty ? 'county-grid' : 'city-radius'})`);

    const supabase = getSupabaseClient();
    
    // Results tracking
    const results: Array<{
      lead_id: string;
      business_name: string;
      phone_e164: string | null;
      demo_url: string | null;
      status: string;
    }> = [];
    
    let noWebsiteCount = 0;
    let demosCreated = 0;
    let queuedCount = 0;

    // Step 3: Process each place - get details, filter, enrich, generate
    for (const place of allPlaces) {
      // Stop if we've hit max demos
      if (demosCreated >= max_demos) {
        console.log(`Reached max demos limit (${max_demos})`);
        break;
      }

      try {
        // Get full details including website
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,geometry,types,business_status,rating,user_ratings_total,photos,address_components&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== "OK") {
          console.log(`Skipping ${place.name}: ${detailsData.status}`);
          continue;
        }

        const detail = detailsData.result;

        // FILTER: Skip if has website
        if (detail.website) {
          console.log(`Skipping ${detail.name}: has website`);
          continue;
        }

        noWebsiteCount++;
        console.log(`Processing no-website lead: ${detail.name}`);

        // Phone normalization
        const phoneRaw = detail.international_phone_number || detail.formatted_phone_number || null;
        let phoneE164: string | null = null;
        
        if (phoneRaw) {
          const digitsOnly = phoneRaw.replace(/\D/g, "");
          if (phoneRaw.startsWith("+")) {
            phoneE164 = phoneRaw.replace(/\s+/g, "");
          } else if (digitsOnly.length === 10) {
            phoneE164 = `+1${digitsOnly}`;
          } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
            phoneE164 = `+${digitsOnly}`;
          }
        }

        const bestPhone = phoneE164 || phoneRaw;

        // Skip if no phone (can't do outreach)
        if (!bestPhone) {
          console.log(`Skipping ${detail.name}: no phone number`);
          continue;
        }

        // Extract address components
        let detailCity = "";
        let detailState = "";
        let detailZip = "";
        let neighborhood = "";
        for (const comp of detail.address_components || []) {
          if (comp.types.includes("locality")) detailCity = comp.long_name;
          if (comp.types.includes("administrative_area_level_1")) detailState = comp.short_name;
          if (comp.types.includes("postal_code")) detailZip = comp.long_name;
          if (comp.types.includes("neighborhood")) neighborhood = comp.long_name;
        }

        // Build enriched data
        const photoReferences = (detail.photos || []).slice(0, 6).map((p: { photo_reference: string }) => p.photo_reference);
        const enrichedMeta = {
          google_enriched: true,
          google_enriched_at: new Date().toISOString(),
          rating: detail.rating || null,
          review_count: detail.user_ratings_total || null,
          city: detailCity,
          state: detailState,
          zip: detailZip,
          neighborhood,
          photo_references: photoReferences,
          business_status: detail.business_status,
        };

        const category = detail.types?.[0]?.replace(/_/g, " ") || null;
        const { score, reasons } = computeLeadScore({
          website: undefined,
          phone: bestPhone,
          business_status: detail.business_status,
        });

        // Upsert lead
        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .upsert({
            place_id: place.place_id,
            source: "google_places",
            query_term: query,
            location_text: location,
            radius_m: radius_m,
            business_name: detail.name,
            phone: bestPhone,
            phone_raw: phoneRaw,
            phone_e164: phoneE164,
            website: null,
            address: detail.formatted_address || null,
            category,
            lat: detail.geometry?.location?.lat,
            lng: detail.geometry?.location?.lng,
            lead_score: score,
            lead_reasons: reasons,
            lead_enriched: enrichedMeta,
          }, { onConflict: "place_id" })
          .select("id, demo_status, demo_url")
          .single();

        if (leadError) {
          console.error(`Lead upsert error for ${detail.name}:`, leadError);
          continue;
        }

        // Skip if demo already exists
        if (lead.demo_status === "created" && lead.demo_url) {
          console.log(`Demo already exists for ${detail.name}`);
          results.push({
            lead_id: lead.id,
            business_name: detail.name,
            phone_e164: phoneE164,
            demo_url: lead.demo_url,
            status: "existing",
          });
          continue;
        }

        // Generate demo
        const templateSlug = getIndustryTemplate(category, query);
        const businessSlug = generateSlug(detail.name);
        const projectToken = generateToken();
        const cityDisplay = detailCity || location;

        // Create project
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert({
            business_name: detail.name,
            business_slug: businessSlug,
            project_token: projectToken,
            contact_phone: bestPhone,
            website: null,
            address: detail.formatted_address,
            city: detailCity,
            state: detailState,
            source: "lead_engine_bulk",
            status: "lead",
          })
          .select("id, project_token")
          .single();

        if (projectError) {
          console.error(`Project creation error for ${detail.name}:`, projectError);
          continue;
        }

        // Build demo content
        const heroHeadline = cityDisplay
          ? `${detail.name} - Serving ${cityDisplay} & Surrounding Areas`
          : `${detail.name} - Your Trusted Local Partner`;

        const demoContent = {
          template: templateSlug,
          hero: {
            headline: heroHeadline,
            subheadline: "Quality service you can trust. Get started today!",
          },
          business: {
            name: detail.name,
            phone: bestPhone,
            address: detail.formatted_address,
            city: detailCity,
            state: detailState,
          },
          enriched: enrichedMeta,
          cta: {
            primary: { label: "Call Now", action: `tel:${(phoneE164 || phoneRaw || "").replace(/\s+/g, "")}` },
            secondary: { label: "Request Quote", action: "#quote" },
            tertiary: detail.formatted_address ? { label: "Get Directions", action: `https://maps.google.com/?q=${encodeURIComponent(detail.formatted_address)}` } : null,
          },
          generated_at: new Date().toISOString(),
        };

        // Create demo
        const { error: demoError } = await supabase
          .from("demos")
          .insert({
            project_id: newProject.id,
            project_token: projectToken,
            template_type: templateSlug,
            content: demoContent,
          });

        if (demoError) {
          console.error(`Demo creation error for ${detail.name}:`, demoError);
          continue;
        }

        const demoUrl = `/d/${projectToken}/${businessSlug}`;

        // Update lead with demo info
        await supabase
          .from("leads")
          .update({
            demo_project_id: newProject.id,
            demo_token: projectToken,
            demo_url: demoUrl,
            demo_status: "created",
            industry_template: templateSlug,
            outreach_status: queue_outreach ? "queued" : "new",
          })
          .eq("id", lead.id);

        // Queue outreach if requested
        if (queue_outreach && phoneE164) {
          await supabase
            .from("lead_outreach_events")
            .insert({
              lead_id: lead.id,
              channel: "sms",
              status: "queued",
              message: null, // Will be populated by sender
            });
          queuedCount++;
        }

        demosCreated++;
        results.push({
          lead_id: lead.id,
          business_name: detail.name,
          phone_e164: phoneE164,
          demo_url: demoUrl,
          status: "created",
        });

        console.log(`Demo created: ${demoUrl}`);

      } catch (err) {
        console.error(`Error processing ${place.name}:`, err);
      }
    }

    // Log the search run
    const { data: searchRun } = await supabase
      .from("lead_search_runs")
      .insert({
        query_term: query,
        location_text: location,
        radius_m: radius_m,
        results_count: results.length,
        provider: "google_places",
        raw_meta: {
          total_found: allPlaces.length,
          no_website_count: noWebsiteCount,
          demos_created: demosCreated,
          max_demos: max_demos,
          queue_outreach,
        },
      })
      .select("id")
      .single();

    console.log(`Pipeline complete: ${demosCreated} demos created from ${noWebsiteCount} no-website leads`);

    return new Response(
      JSON.stringify({
        run_id: searchRun?.id || null,
        total_found: allPlaces.length,
        no_website_count: noWebsiteCount,
        demos_created: demosCreated,
        queued_count: queuedCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Search-and-generate error:", error);
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
    const phoneMissing = url.searchParams.get("phone_missing") === "true";
    const minScore = parseInt(url.searchParams.get("min_score") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const supabase = getSupabaseClient();

    let query = supabase
      .from("leads")
      .select("id, place_id, business_name, phone, phone_raw, phone_e164, website, address, category, lat, lng, lead_score, lead_reasons, demo_status, demo_url, industry_template, outreach_status, created_at")
      .gte("lead_score", minScore)
      .order("lead_score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (noWebsiteOnly) {
      query = query.is("website", null);
    }

    if (phoneMissing) {
      query = query.is("phone", null);
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

// Map category/query to industry template
function getIndustryTemplate(category: string | null, queryTerm: string | null): string {
  const combined = `${category || ""} ${queryTerm || ""}`.toLowerCase();
  
  if (/roof|siding|gutter|contractor|construction|hvac|plumb|electric|landscap|paving|paint|handy|remodel|floor/.test(combined)) {
    return "home-services";
  }
  if (/salon|barber|spa|nail|hair|beauty|cosmet|massage/.test(combined)) {
    return "beauty";
  }
  if (/restaurant|cafe|coffee|food|bakery|pizz|grill|bar|pub|dining/.test(combined)) {
    return "restaurant";
  }
  if (/realtor|real estate|property|mortgage|broker/.test(combined)) {
    return "real-estate";
  }
  if (/auto|car|mechanic|repair|tire|body shop|detailing/.test(combined)) {
    return "automotive";
  }
  if (/dentist|dental|doctor|clinic|medical|health|chiro|physio|optom/.test(combined)) {
    return "healthcare";
  }
  if (/law|legal|attorney|accountant|cpa|consult|financial/.test(combined)) {
    return "professional";
  }
  if (/gym|fitness|yoga|personal train|martial/.test(combined)) {
    return "fitness";
  }
  
  return "small-business";
}

// Extract city/town from address
function extractCityFromAddress(address: string | null): string {
  if (!address) return "";
  // Try to extract city from format "123 Main St, City, ST 12345"
  const parts = address.split(",");
  if (parts.length >= 2) {
    return parts[1].trim().split(" ")[0];
  }
  return "";
}

// Generate slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

// Generate a unique token
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST /leads/:id/generate-demo - Generate demo for a lead
async function handleGenerateDemo(req: Request, leadId: string): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  const supabase = getSupabaseClient();

  try {
    // Load the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating demo for lead: ${lead.business_name}`);

    // Determine industry template
    const templateSlug = getIndustryTemplate(lead.category, lead.query_term);
    const cityName = extractCityFromAddress(lead.address);
    const businessSlug = generateSlug(lead.business_name);

    let projectId = lead.demo_project_id;
    let projectToken = lead.demo_token;
    
    // Use best available phone
    const bestPhone = lead.phone_e164 || lead.phone_raw || lead.phone;
    const phoneForTel = bestPhone?.replace(/\s+/g, "") || null;

    // Create or reuse project
    if (!projectId) {
      projectToken = generateToken();
      
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          business_name: lead.business_name,
          business_slug: businessSlug,
          project_token: projectToken,
          contact_phone: bestPhone,
          website: lead.website,
          address: lead.address,
          city: cityName,
          source: "lead_engine",
          status: "lead",
        })
        .select("id, project_token")
        .single();

      if (projectError) {
        console.error("Failed to create project:", projectError);
        // Update lead with failed status
        await supabase
          .from("leads")
          .update({ demo_status: "failed" })
          .eq("id", leadId);
          
        return new Response(
          JSON.stringify({ error: "Failed to create project", details: projectError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      projectId = newProject.id;
      projectToken = newProject.project_token;
    }

    // Build demo content
    const heroHeadline = cityName
      ? `${lead.business_name} - Serving ${cityName} & Surrounding Areas`
      : `${lead.business_name} - Your Trusted Local Partner`;
    
    const demoContent = {
      template: templateSlug,
      hero: {
        headline: heroHeadline,
        subheadline: "Quality service you can trust. Get started today!",
      },
      business: {
        name: lead.business_name,
        phone: bestPhone,
        address: lead.address,
        website: lead.website,
      },
      cta: {
        primary: phoneForTel ? { label: "Call Now", action: `tel:${phoneForTel}` } : null,
        secondary: { label: "Request Quote", action: "#quote" },
        tertiary: lead.address ? { label: "Get Directions", action: `https://maps.google.com/?q=${encodeURIComponent(lead.address)}` } : null,
      },
      generated_at: new Date().toISOString(),
    };

    // Upsert demo record
    const { error: demoError } = await supabase
      .from("demos")
      .upsert({
        project_id: projectId,
        project_token: projectToken,
        template_type: templateSlug,
        content: demoContent,
      }, { onConflict: "project_id" });

    if (demoError) {
      console.error("Failed to create demo:", demoError);
      await supabase
        .from("leads")
        .update({ demo_status: "failed" })
        .eq("id", leadId);
        
      return new Response(
        JSON.stringify({ error: "Failed to create demo", details: demoError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build demo URL
    const demoUrl = `/d/${projectToken}/${templateSlug}`;

    // Update lead with demo info
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        demo_project_id: projectId,
        demo_token: projectToken,
        demo_url: demoUrl,
        demo_status: "created",
        industry_template: templateSlug,
      })
      .eq("id", leadId);

    if (updateError) {
      console.error("Failed to update lead:", updateError);
    }

    console.log(`Demo generated: ${demoUrl}`);

    return new Response(
      JSON.stringify({
        ok: true,
        demo_url: demoUrl,
        project_token: projectToken,
        template_slug: templateSlug,
        project_id: projectId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Generate demo error:", error);
    
    // Mark as failed
    await supabase
      .from("leads")
      .update({ demo_status: "failed" })
      .eq("id", leadId);
      
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /leads/request-demo - Public endpoint for lead capture + auto demo generation
async function handleRequestDemo(req: Request): Promise<Response> {
  try {
    let body: { business_name?: string; city?: string; phone?: string; website?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { business_name, city, phone, website } = body;

    if (!business_name || !city) {
      return new Response(
        JSON.stringify({ error: "business_name and city are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Request demo: "${business_name}" in "${city}"`);

    const supabase = getSupabaseClient();
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    // Generate a place_id placeholder for manual leads
    const manualPlaceId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Normalize phone if provided
    let phoneE164: string | null = null;
    let phoneRaw = phone || null;
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, "");
      if (phone.startsWith("+")) {
        phoneE164 = phone.replace(/\s+/g, "");
      } else if (digitsOnly.length === 10) {
        phoneE164 = `+1${digitsOnly}`;
      } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
        phoneE164 = `+${digitsOnly}`;
      }
    }

    // Try to find existing lead or Google Places match
    let leadId: string | null = null;
    let enrichedData: Record<string, unknown> = {};

    if (apiKey) {
      // Search for business in Google Places
      const searchQuery = `${business_name} ${city}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
      
      try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (searchData.status === "OK" && searchData.results?.length > 0) {
          const firstResult = searchData.results[0];
          console.log(`Found Google Places match: ${firstResult.name} (${firstResult.place_id})`);
          
          // Check if lead already exists
          const { data: existingLead } = await supabase
            .from("leads")
            .select("id, demo_url, demo_status")
            .eq("place_id", firstResult.place_id)
            .single();
          
          if (existingLead) {
            leadId = existingLead.id;
            console.log(`Existing lead found: ${leadId}`);
            
            // If demo already exists, return it
            if (existingLead.demo_url && existingLead.demo_status === "created") {
              return new Response(
                JSON.stringify({ ok: true, demo_url: existingLead.demo_url }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          } else {
            // Get place details for enrichment
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${firstResult.place_id}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,geometry,types,business_status,rating,user_ratings_total,photos,address_components&key=${apiKey}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();
            
            if (detailsData.status === "OK") {
              const detail = detailsData.result;
              
              // Extract city/state from address components
              let detailCity = "";
              let detailState = "";
              let detailZip = "";
              for (const comp of detail.address_components || []) {
                if (comp.types.includes("locality")) detailCity = comp.long_name;
                if (comp.types.includes("administrative_area_level_1")) detailState = comp.short_name;
                if (comp.types.includes("postal_code")) detailZip = comp.long_name;
              }

              // Build enriched data
              enrichedData = {
                rating: detail.rating || null,
                reviewCount: detail.user_ratings_total || null,
                photoReferences: (detail.photos || []).slice(0, 6).map((p: { photo_reference: string }) => p.photo_reference),
                city: detailCity,
                state: detailState,
                zip: detailZip,
                business_status: detail.business_status || null,
              };

              // Phone from Google if not provided
              if (!phoneRaw && detail.international_phone_number) {
                phoneRaw = detail.international_phone_number;
              }
              if (phoneRaw && !phoneE164) {
                const digits = phoneRaw.replace(/\D/g, "");
                if (phoneRaw.startsWith("+")) {
                  phoneE164 = phoneRaw.replace(/\s+/g, "");
                } else if (digits.length === 10) {
                  phoneE164 = `+1${digits}`;
                }
              }

              // Insert new lead with enriched data
              const category = detail.types?.[0]?.replace(/_/g, " ") || null;
              const { data: newLead, error: insertError } = await supabase
                .from("leads")
                .insert({
                  place_id: firstResult.place_id,
                  source: "request_demo",
                  business_name: detail.name || business_name,
                  phone: phoneE164 || phoneRaw,
                  phone_raw: phoneRaw,
                  phone_e164: phoneE164,
                  website: website || detail.website || null,
                  address: detail.formatted_address || null,
                  category,
                  lat: detail.geometry?.location?.lat,
                  lng: detail.geometry?.location?.lng,
                  location_text: city,
                  lead_score: 50,
                  lead_reasons: ["requested_demo"],
                  lead_enriched: enrichedData,
                })
                .select("id")
                .single();

              if (!insertError && newLead) {
                leadId = newLead.id;
              }
            }
          }
        }
      } catch (searchError) {
        console.error("Google Places search error:", searchError);
      }
    }

    // If no Google match, create manual lead
    if (!leadId) {
      const { data: manualLead, error: manualError } = await supabase
        .from("leads")
        .insert({
          place_id: manualPlaceId,
          source: "request_demo",
          business_name: business_name,
          phone: phoneE164 || phoneRaw,
          phone_raw: phoneRaw,
          phone_e164: phoneE164,
          website: website || null,
          location_text: city,
          lead_score: 40,
          lead_reasons: ["requested_demo", "manual_entry"],
        })
        .select("id")
        .single();

      if (manualError) {
        console.error("Failed to create manual lead:", manualError);
        return new Response(
          JSON.stringify({ error: "Failed to create lead" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      leadId = manualLead.id;
    }

    // Now generate the demo
    const templateSlug = getIndustryTemplate(null, business_name);
    const businessSlug = generateSlug(business_name);
    const projectToken = generateToken();
    const bestPhone = phoneE164 || phoneRaw;

    // Create project
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        business_name: business_name,
        business_slug: businessSlug,
        project_token: projectToken,
        contact_phone: bestPhone,
        website: website || null,
        city: city,
        source: "request_demo",
        status: "lead",
      })
      .select("id, project_token")
      .single();

    if (projectError) {
      console.error("Failed to create project:", projectError);
      return new Response(
        JSON.stringify({ error: "Failed to create demo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build demo content with enriched data
    const heroHeadline = city
      ? `${business_name} - Serving ${city} & Surrounding Areas`
      : `${business_name} - Your Trusted Local Partner`;

    const demoContent = {
      template: templateSlug,
      hero: {
        headline: heroHeadline,
        subheadline: "Quality service you can trust. Get started today!",
      },
      business: {
        name: business_name,
        phone: bestPhone,
        city: city,
        website: website || null,
      },
      enriched: enrichedData,
      cta: {
        primary: bestPhone ? { label: "Call Now", action: `tel:${bestPhone.replace(/\s+/g, "")}` } : null,
        secondary: { label: "Request Quote", action: "#quote" },
      },
      generated_at: new Date().toISOString(),
    };

    // Create demo record
    const { error: demoError } = await supabase
      .from("demos")
      .insert({
        project_id: newProject.id,
        project_token: projectToken,
        template_type: templateSlug,
        content: demoContent,
      });

    if (demoError) {
      console.error("Failed to create demo:", demoError);
      return new Response(
        JSON.stringify({ error: "Failed to create demo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build demo URL
    const demoUrl = `/d/${projectToken}/${businessSlug}`;

    // Update lead with demo info
    await supabase
      .from("leads")
      .update({
        demo_project_id: newProject.id,
        demo_token: projectToken,
        demo_url: demoUrl,
        demo_status: "created",
        industry_template: templateSlug,
        outreach_status: "requested",
      })
      .eq("id", leadId);

    console.log(`Demo created: ${demoUrl}`);

    return new Response(
      JSON.stringify({
        ok: true,
        demo_url: demoUrl,
        project_token: projectToken,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Request demo error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// ==================== CLEAR DEMOS HANDLER ====================
async function handleClearDemos(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    const supabase = getSupabaseClient();

    // Delete all leads that have demo_status = 'created'
    const { data, error } = await supabase
      .from("leads")
      .delete()
      .eq("demo_status", "created")
      .select("id");

    if (error) {
      console.error("Failed to clear leads:", error);
      return new Response(
        JSON.stringify({ error: "Failed to clear leads" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deletedCount = data?.length || 0;
    console.log(`Cleared ${deletedCount} leads with demos`);

    return new Response(
      JSON.stringify({ ok: true, deleted: deletedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Clear demos error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
