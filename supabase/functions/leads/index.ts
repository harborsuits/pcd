import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  // Route: POST /leads/:id/review (admin only - approve/reject demo)
  if (subPath.endsWith("/review") && req.method === "POST") {
    const leadId = subPath.replace("/review", "");
    return handleReviewDemo(req, leadId);
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

// Validate admin access via JWT and role check
async function validateAdminKey(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("Missing or invalid Authorization header");
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Missing authentication token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  // Create client with user's auth header to validate JWT
  const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseWithAuth.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    console.log("Invalid JWT token:", claimsError?.message);
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.claims.sub as string;
  const email = claimsData.claims.email as string || "unknown";

  // Check if user has admin role using service client
  const supabase = getSupabaseClient();
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    console.error("Role check error:", roleError);
    return new Response(
      JSON.stringify({ error: "Server error", message: "Failed to verify permissions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!roleData) {
    console.log(`User ${userId} (${email}) attempted admin access without admin role`);
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`Admin authenticated: ${email} (${userId})`);
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
  const authError = await validateAdminKey(req);
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
  const authError = await validateAdminKey(req);
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
  const authError = await validateAdminKey(req);
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
  const authError = await validateAdminKey(req);
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

// POST /leads/:id/generate-demo - Generate demo for a lead (supports force regeneration)
async function handleGenerateDemo(req: Request, leadId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  const supabase = getSupabaseClient();

  // Parse optional body for force flag and category override
  let forceRegenerate = false;
  let categoryOverride: string | null = null;
  try {
    const body = await req.json();
    forceRegenerate = body?.force === true;
    categoryOverride = body?.category || null;
  } catch {
    // No body is fine - default to normal generate
  }

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

    console.log(`Generating demo for lead: ${lead.business_name} (force=${forceRegenerate}, categoryOverride=${categoryOverride})`);

    // Determine industry template - use override if provided
    const effectiveCategory = categoryOverride || lead.category;
    const templateSlug = getIndustryTemplate(effectiveCategory, lead.query_term);
    const cityName = extractCityFromAddress(lead.address);
    const businessSlug = generateSlug(lead.business_name);

    // If force regenerating, we'll reuse the existing project but update demo content
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

    console.log(`Demo ${forceRegenerate ? 'regenerated' : 'generated'}: ${demoUrl}`);

    return new Response(
      JSON.stringify({
        ok: true,
        demo_url: demoUrl,
        project_token: projectToken,
        template_slug: templateSlug,
        project_id: projectId,
        regenerated: forceRegenerate,
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
  // Check if user is authenticated (for immediate owner_user_id assignment)
  let authenticatedUserId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    try {
      const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseWithAuth.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims?.sub) {
        authenticatedUserId = claimsData.claims.sub as string;
        console.log(`Authenticated user creating project: ${authenticatedUserId}`);
      }
    } catch (err) {
      console.log("Auth check failed (non-fatal):", err);
      // Non-fatal - continue as unauthenticated
    }
  }

  try {
    // Define body type with all fields including new intake_details structure
    let body: { 
      business_name?: string; 
      city?: string; 
      phone?: string; 
      email?: string;
      your_name?: string;
      website?: string;
      occupation?: string;
      expectations?: string;
      demo_type?: string;
      website_style?: string;
      receptionist_focus?: string;
      service_type?: string;
      // 7-day AI trial flag
      is_trial?: boolean;
      // Tier and product type (NEW)
      tier?: string;
      product_type?: string;
      // Template routing fields
      product_key?: string;
      intake_template?: string;
      intake_track?: string; // "new_site" | "improve_existing"
      // Website fields
      website_goal?: string;
      timeline?: string;
      logo_status?: string;
      brand_colors?: string;
      services_list?: string;
      photo_readiness?: string;
      // Track A: Content fields (NEW)
      hero_line?: string;
      about_blurb?: string;
      services_detailed?: Array<{ name: string; description: string }>;
      primary_cta?: string;
      secondary_cta?: string;
      // Track A: Links fields (NEW)
      gbp_link?: string;
      facebook_handle?: string;
      instagram_handle?: string;
      tiktok_handle?: string;
      reviews_google_link?: string;
      reviews_yelp_link?: string;
      inspiration_sites?: string[];
      // Track A: Hours fields (NEW)
      business_hours_detailed?: Record<string, string>;
      service_area_detailed?: string;
      preferred_contact_method?: string;
      // Track A: Design fields (NEW)
      vibe?: string;
      font_preference?: string;
      // Track A: Features (NEW)
      features_needed?: string[];
      // Track A: Trust signals (NEW)
      years_in_business?: string;
      awards?: string;
      team_size?: string;
      review_count?: string;
      average_rating?: string;
      testimonials?: string[];
      // Track B: Existing site fields (NEW)
      existing_platform?: string;
      existing_platform_other?: string;
      existing_site_url?: string;
      work_requested?: string[];
      access_method?: string;
      access_instructions?: string;
      access_checklist?: Record<string, string>;
      // AI fields - Basics & Operations
      business_phone?: string;
      business_hours?: string;
      services_offered?: string;
      escalation_number?: string;
      emergency_rules?: string;
      preferred_tone?: string;
      booking_link?: string;
      faqs?: string;
      emergency_triggers?: string[];
      // AI fields - Call Handling
      call_handling?: string;
      after_hours_action?: string;
      text_handling?: string[];
      handoff_method?: string;
      // AI fields - Customer Knowledge
      team_names?: string;
      customer_faqs?: string;
      do_not_say?: string;
      guarantees_policies?: string;
      business_personality?: string[];
      // AI fields - Lead & Ops
      lead_fields?: string[];
      qualified_lead_rules?: string;
      service_constraints?: string;
      service_area_rules?: string;
      pricing_guidance?: string;
      handoff_triggers?: string[];
      // Other fields
      selected_services?: string[];
      custom_request?: string;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      business_name, 
      city, 
      phone,
      email,
      your_name,
      website,
      occupation,
      expectations,
      demo_type,
      website_style,
      receptionist_focus,
      service_type,
      // 7-day AI trial flag
      is_trial,
      // Tier and product type (NEW)
      tier,
      product_type,
      // Template routing
      product_key,
      intake_template,
      intake_track,
      // Website fields
      website_goal,
      timeline,
      logo_status,
      brand_colors,
      services_list,
      photo_readiness,
      // Track A: Content (NEW)
      hero_line,
      about_blurb,
      services_detailed,
      primary_cta,
      secondary_cta,
      // Track A: Links (NEW)
      gbp_link,
      facebook_handle,
      instagram_handle,
      tiktok_handle,
      reviews_google_link,
      reviews_yelp_link,
      inspiration_sites,
      // Track A: Hours (NEW)
      business_hours_detailed,
      service_area_detailed,
      preferred_contact_method,
      // Track A: Design (NEW)
      vibe,
      font_preference,
      // Track A: Features (NEW)
      features_needed,
      // Track A: Trust signals (NEW)
      years_in_business,
      awards,
      team_size,
      review_count,
      average_rating,
      testimonials,
      // Track B: Existing site (NEW)
      existing_platform,
      existing_platform_other,
      existing_site_url,
      work_requested,
      access_method,
      access_instructions,
      access_checklist,
      // AI fields - Basics & Operations
      business_phone,
      business_hours,
      services_offered,
      escalation_number,
      emergency_rules,
      preferred_tone,
      booking_link,
      faqs,
      emergency_triggers,
      // AI fields - Call Handling
      call_handling,
      after_hours_action,
      text_handling,
      handoff_method,
      // AI fields - Customer Knowledge
      team_names,
      customer_faqs,
      do_not_say,
      guarantees_policies,
      business_personality,
      // AI fields - Lead & Ops
      lead_fields,
      qualified_lead_rules,
      service_constraints,
      service_area_rules,
      pricing_guidance,
      handoff_triggers,
      // Other fields
      selected_services,
      custom_request,
    } = body;

    // Compute required sections based on template
    const computeRequiredSections = (template: string | undefined): string[] => {
      switch (template) {
        case "web_new_build":
          return ["content", "links", "hours", "design"];
        case "web_existing":
          return ["existing_site", "access_checklist"];
        case "ai_receptionist":
          return ["ai_coverage", "ai_operations", "ai_leads", "ai_voice"];
        case "bundle_web_ai":
        case "bundle_starter":
        case "bundle_growth":
        case "bundle_full_ops":
          return ["content", "links", "hours", "design", "ai_coverage", "ai_operations"];
        default:
          return [];
      }
    };

    // Build structured intake_details object (NEW)
    const intakeDetails = {
      required_sections: computeRequiredSections(intake_template),
      // Track A: Content
      content: hero_line || services_detailed?.length ? {
        hero_line: hero_line || null,
        about_blurb: about_blurb || null,
        services: services_detailed || [],
        primary_cta: primary_cta || website_goal || null,
        secondary_cta: secondary_cta || null,
      } : null,
      // Track A: Links
      links: gbp_link || facebook_handle || instagram_handle ? {
        current_website: website || null,
        gbp: gbp_link || null,
        facebook: facebook_handle || null,
        instagram: instagram_handle || null,
        tiktok: tiktok_handle || null,
        reviews_google: reviews_google_link || null,
        reviews_yelp: reviews_yelp_link || null,
        inspiration_sites: inspiration_sites || [],
      } : null,
      // Track A: Hours
      hours: business_hours_detailed || service_area_detailed ? {
        ...business_hours_detailed,
        service_area: service_area_detailed || city || null,
        preferred_contact_method: preferred_contact_method || null,
      } : null,
      // Track A: Design
      design: vibe ? {
        vibe: vibe || null,
        must_colors: brand_colors || null,
        font_preference: font_preference || null,
      } : null,
      // Track A: Features
      features_needed: features_needed || [],
      // Track A: Trust signals
      trust_signals: years_in_business || awards || review_count ? {
        years_in_business: years_in_business || null,
        awards: awards || null,
        team_size: team_size || null,
        review_count: review_count || null,
        average_rating: average_rating || null,
        testimonials: testimonials || [],
      } : null,
      // Track B: Existing site
      existing_site: existing_platform || existing_site_url ? {
        platform: existing_platform || null,
        platform_other: existing_platform_other || null,
        url: existing_site_url || website || null,
        work_requested: work_requested || [],
        access_method: access_method || null,
        access_instructions: access_instructions || null,
      } : null,
      // Track B: Access checklist
      access_checklist: access_checklist || null,
    };
    
    // Build request metadata for operator visibility (legacy support)
    const requestMeta = {
      occupation: occupation || null,
      expectations: expectations || null,
      demo_type: demo_type || null,
      website_style: website_style || null,
      receptionist_focus: receptionist_focus || null,
      service_type: service_type || null,
      your_name: your_name || null,
      email: email || null,
      // Website fields
      website_goal: website_goal || null,
      timeline: timeline || null,
      logo_status: logo_status || null,
      brand_colors: brand_colors || null,
      services_list: services_list || null,
      photo_readiness: photo_readiness || null,
      // AI fields - Basics & Operations
      business_phone: business_phone || null,
      business_hours: business_hours || null,
      services_offered: services_offered || null,
      escalation_number: escalation_number || null,
      emergency_rules: emergency_rules || null,
      preferred_tone: preferred_tone || null,
      booking_link: booking_link || null,
      faqs: faqs || null,
      // AI fields - Call Handling
      call_handling: call_handling || null,
      after_hours_action: after_hours_action || null,
      text_handling: text_handling || null,
      handoff_method: handoff_method || null,
      // AI fields - Customer Knowledge
      team_names: team_names || null,
      customer_faqs: customer_faqs || null,
      do_not_say: do_not_say || null,
      guarantees_policies: guarantees_policies || null,
      business_personality: business_personality || null,
      // AI fields - Lead & Ops
      lead_fields: lead_fields || null,
      qualified_lead_rules: qualified_lead_rules || null,
      service_constraints: service_constraints || null,
      service_area_rules: service_area_rules || null,
      pricing_guidance: pricing_guidance || null,
      handoff_triggers: handoff_triggers || null,
      // Other fields
      selected_services: selected_services || null,
      custom_request: custom_request || null,
      requested_at: new Date().toISOString(),
    };

    // Log incoming request for debugging
    console.log(`Request demo received - business_name: "${business_name}", city: "${city}", service_type: "${service_type}", email: "${email}"`);
    
    // business_name is always required
    // city is required for demo, website, both; optional for ai, ai_receptionist, and other
    const cityRequired = !service_type || service_type === "demo" || service_type === "website" || service_type === "both";
    
    if (!business_name) {
      console.log("Validation failed: business_name is required");
      return new Response(
        JSON.stringify({ error: "business_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (cityRequired && !city) {
      console.log(`Validation failed: city is required for service_type "${service_type}"`);
      return new Response(
        JSON.stringify({ error: `city is required for this service type (${service_type || "none"})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Request demo: "${business_name}"${city ? ` in "${city}"` : ""} (service: ${service_type || "unknown"})`);

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

    // Generate slug and token
    const businessSlug = generateSlug(business_name);
    const projectToken = generateToken();
    const bestPhone = phoneE164 || phoneRaw;

    // Build notes from request metadata for operator visibility
    const notesLines = [];
    if (your_name) notesLines.push(`Contact: ${your_name}`);
    if (email) notesLines.push(`Email: ${email}`);
    if (service_type) notesLines.push(`Service: ${service_type}`);
    if (timeline) notesLines.push(`Timeline: ${timeline}`);
    if (website_goal) notesLines.push(`Website goal: ${website_goal}`);
    if (logo_status) notesLines.push(`Logo: ${logo_status}`);
    if (photo_readiness) notesLines.push(`Photos: ${photo_readiness}`);
    if (brand_colors) notesLines.push(`Brand colors: ${brand_colors}`);
    if (services_list) notesLines.push(`Services: ${services_list}`);
    if (preferred_tone) notesLines.push(`Tone: ${preferred_tone}`);
    if (booking_link) notesLines.push(`Booking: ${booking_link}`);
    if (selected_services?.length) notesLines.push(`Selected services: ${selected_services.join(", ")}`);
    if (custom_request) notesLines.push(`Custom request: ${custom_request}`);
    const projectNotes = notesLines.length > 0 ? notesLines.join('\n') : null;

    // Create project (with owner_user_id if user is authenticated)
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        business_name: business_name,
        business_slug: businessSlug,
        project_token: projectToken,
        contact_phone: bestPhone,
        contact_email: email || null,
        contact_name: your_name || null,
        website: website || null,
        city: city || null,
        source: "request_demo",
        service_type: service_type || "demo",
        status: "lead",
        notes: projectNotes,
        // Set AI trial fields for 7-day trials
        is_ai_trial: is_trial === true,
        ai_trial_ends_at: is_trial === true 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
          : null,
        // Set AI status for AI receptionist projects
        ai_trial_status: is_trial === true 
          ? "trial_active" 
          : (service_type === "ai_receptionist" || service_type === "both") ? "intake_received" : null,
        // Set deposit_status - skip for free demos/trials
        deposit_status: (is_trial === true || service_type === "demo") ? "skipped" : "pending",
        // Set owner immediately if user is authenticated
        owner_user_id: authenticatedUserId,
      })
      .select("id, project_token")
      .single();

    if (projectError) {
      console.error("Failed to create project:", projectError);
      return new Response(
        JSON.stringify({ error: "Failed to create project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure claim code for unauthenticated submissions
    let claimCode: string | null = null;
    if (!authenticatedUserId) {
      // Generate claim code (PCD-XXXX-XXXX format, human-readable chars only)
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const generateCode = () => {
        const part = (n: number) =>
          Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        return `PCD-${part(4)}-${part(4)}`;
      };

      // Try up to 5 times to generate a unique code
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateCode();
        const { error: codeError } = await supabase
          .from("projects")
          .update({
            claim_code: candidate,
            claim_code_created_at: new Date().toISOString(),
          })
          .eq("id", newProject.id);

        if (!codeError) {
          claimCode = candidate;
          console.log(`Claim code generated for project ${projectToken}: ${candidate}`);
          break;
        } else if (codeError.code === "23505") {
          // Unique constraint violation, try again
          console.log(`Claim code collision, retrying (attempt ${attempt + 1})`);
        } else {
          console.error("Failed to set claim code:", codeError);
          break;
        }
      }
    }

    // Create intake record with all the form data including new intake_details structure
    const intakeData = {
      // Tier and pricing (NEW)
      tier: tier || null,
      product_type: product_type || null,
      // Template routing
      product_key: product_key || null,
      intake_template: intake_template || null,
      intake_track: intake_track || null,
      // Structured intake details
      intake_details: intakeDetails,
      // Legacy flat fields for backwards compatibility
      service_type: service_type || "demo",
      business_name,
      city,
      phone: bestPhone,
      email,
      your_name,
      website,
      // Website fields
      website_goal,
      timeline,
      logo_status,
      brand_colors,
      services_list,
      photo_readiness,
      // AI fields - Basics & Operations
      business_phone,
      business_hours,
      services_offered,
      escalation_number,
      emergency_rules,
      emergency_triggers,
      preferred_tone,
      booking_link,
      faqs,
      // AI fields - Call Handling
      call_handling,
      after_hours_action,
      text_handling,
      handoff_method,
      // AI fields - Customer Knowledge
      team_names,
      customer_faqs,
      do_not_say,
      guarantees_policies,
      business_personality,
      // AI fields - Lead & Ops
      lead_fields,
      qualified_lead_rules,
      service_constraints,
      service_area_rules,
      pricing_guidance,
      handoff_triggers,
      // Other fields
      selected_services,
      custom_request,
      submitted_at: new Date().toISOString(),
    };

    const { error: intakeError } = await supabase
      .from("project_intakes")
      .insert({
        project_id: newProject.id,
        intake_json: intakeData,
        intake_status: "submitted",
      });

    if (intakeError) {
      console.error("Failed to create intake:", intakeError);
      // Non-fatal - project was created
    }

    // Create client portal identity record (for AI and Full Package submissions)
    if (email && (service_type === "ai_receptionist" || service_type === "both" || service_type === "website")) {
      const { error: clientError } = await supabase
        .from("project_clients")
        .insert({
          project_id: newProject.id,
          project_token: projectToken,
          email: email,
          phone: bestPhone || null,
          name: your_name || null,
          role: "owner",
          // Mark as accepted if user is already authenticated
          invite_status: authenticatedUserId ? "accepted" : "invited",
          invite_sent_at: new Date().toISOString(),
        });

      if (clientError) {
        console.error("Failed to create client record:", clientError);
        // Non-fatal - project was created
      } else {
        console.log(`Client record created for ${email} on project ${projectToken} (status: ${authenticatedUserId ? "accepted" : "invited"})`);
      }

      // Trigger welcome email notification
      const { error: notifError } = await supabase
        .from("notification_events")
        .insert({
          project_id: newProject.id,
          project_token: projectToken,
          event_type: "portal_ready",
          payload: {
            service_type: service_type,
            business_name: business_name,
            contact_name: your_name || null,
          },
        });

      if (notifError) {
        console.error("Failed to create notification event:", notifError);
        // Non-fatal
      }
    }

    // For "demo" service type ONLY, generate an actual demo site
    if (service_type === "demo") {
      const templateSlug = getIndustryTemplate(null, business_name);

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

      console.log(`Demo created for service_type=demo: ${demoUrl}`);

      return new Response(
        JSON.stringify({
          ok: true,
          demo_url: demoUrl,
          project_token: projectToken,
          claim_code: claimCode, // Include claim code in response
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For all other service types (website, ai, both, other), 
    // just create the project + intake, NO demo generated
    console.log(`Intake submitted for service_type=${service_type}: project ${projectToken}`);

    return new Response(
      JSON.stringify({
        ok: true,
        project_token: projectToken,
        claim_code: claimCode, // Include claim code in response
        message: "Your request has been submitted. We'll be in touch soon!",
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
  const authError = await validateAdminKey(req);
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

// ==================== REVIEW DEMO HANDLER ====================
async function handleReviewDemo(req: Request, leadId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    let body: { status?: string; notes?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { status, notes } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status. Must be: pending, approved, or rejected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Update lead with review status
    const { data: lead, error } = await supabase
      .from("leads")
      .update({
        demo_review_status: status,
        demo_review_notes: notes ?? null,
        demo_reviewed_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select("id, business_name, demo_review_status")
      .single();

    if (error) {
      console.error("Review update error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update review status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead ${leadId} (${lead.business_name}) review status updated to: ${status}`);

    return new Response(
      JSON.stringify({ ok: true, lead }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Review demo error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
