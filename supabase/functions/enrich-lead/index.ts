import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal fields to reduce quota usage
const PLACES_FIELDS = [
  "name",
  "rating",
  "user_ratings_total",
  "formatted_address",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "address_components",
  "geometry",
  "types",
  "photos",
  "opening_hours",
  "business_status"
].join(",");

interface PlaceDetails {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location: { lat: number; lng: number };
  };
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  business_status?: string;
}

function extractAddressComponents(components: PlaceDetails["address_components"]) {
  if (!components) return {};
  
  const result: Record<string, string> = {};
  
  for (const component of components) {
    if (component.types.includes("locality")) {
      result.city = component.long_name;
    }
    if (component.types.includes("administrative_area_level_1")) {
      result.state = component.short_name;
    }
    if (component.types.includes("postal_code")) {
      result.zip = component.long_name;
    }
    if (component.types.includes("neighborhood")) {
      result.neighborhood = component.long_name;
    }
  }
  
  return result;
}

// Map Google place types to industry templates
function inferIndustryTemplate(types: string[] | undefined, category: string | undefined): string {
  const allTypes = [...(types || []), category?.toLowerCase() || ""].join(" ");
  
  if (allTypes.includes("plumb")) return "plumber";
  if (allTypes.includes("roof")) return "roofer";
  if (allTypes.includes("electr")) return "electrician";
  if (allTypes.includes("hvac") || allTypes.includes("heating") || allTypes.includes("air_condition")) return "hvac";
  if (allTypes.includes("restaurant") || allTypes.includes("food") || allTypes.includes("cafe")) return "restaurant";
  if (allTypes.includes("landscap") || allTypes.includes("lawn")) return "landscaper";
  if (allTypes.includes("paint")) return "painter";
  if (allTypes.includes("clean")) return "cleaner";
  
  return "default";
}

// Normalize phone to E.164 format
function normalizeToE164(phone: string | undefined): string | null {
  if (!phone) return null;
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");
  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    // Assume US if 10 digits
    if (cleaned.length === 10) {
      cleaned = "+1" + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
      cleaned = "+" + cleaned;
    }
  }
  return cleaned || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Admin auth check
    const adminKey = Deno.env.get("ADMIN_KEY");
    const providedKey = req.headers.get("x-admin-key");
    
    if (!adminKey || providedKey !== adminKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead_id } = await req.json();
    
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    
    if (!googleApiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Google API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      console.error("Lead not found:", leadError);
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lead.place_id) {
      return new Response(JSON.stringify({ error: "Lead has no place_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enriching lead ${lead_id} with place_id: ${lead.place_id}`);

    // Fetch Place Details from Google
    const placesUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    placesUrl.searchParams.set("place_id", lead.place_id);
    placesUrl.searchParams.set("fields", PLACES_FIELDS);
    placesUrl.searchParams.set("key", googleApiKey);

    const placesRes = await fetch(placesUrl.toString());
    const placesData = await placesRes.json();

    if (placesData.status !== "OK") {
      console.error("Google Places API error:", placesData.status, placesData.error_message);
      return new Response(JSON.stringify({ 
        error: "Google Places API error", 
        details: placesData.status 
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const place: PlaceDetails = placesData.result;
    const addressParts = extractAddressComponents(place.address_components);
    const industryTemplate = inferIndustryTemplate(place.types, lead.category);

    // Extract photo references (store up to 6)
    const photoReferences = (place.photos || [])
      .slice(0, 6)
      .map(p => p.photo_reference);

    // Build enriched data object (separate from lead_reasons array)
    const enrichedMeta = {
      google_enriched: true,
      google_enriched_at: new Date().toISOString(),
      rating: place.rating,
      review_count: place.user_ratings_total,
      city: addressParts.city,
      state: addressParts.state,
      zip: addressParts.zip,
      neighborhood: addressParts.neighborhood,
      photo_references: photoReferences,
      business_status: place.business_status,
    };

    const enrichedData = {
      // Update lead fields
      business_name: place.name || lead.business_name,
      address: place.formatted_address || lead.address,
      phone: place.formatted_phone_number || lead.phone,
      phone_e164: normalizeToE164(place.international_phone_number) || lead.phone_e164,
      website: place.website || lead.website,
      lat: place.geometry?.location.lat || lead.lat,
      lng: place.geometry?.location.lng || lead.lng,
      industry_template: industryTemplate,
      // Store enriched data separately - lead_reasons stays as array for scoring
      lead_enriched: enrichedMeta,
    };

    // Update lead record
    const { error: updateError } = await supabase
      .from("leads")
      .update(enrichedData)
      .eq("id", lead_id);

    if (updateError) {
      console.error("Failed to update lead:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Lead ${lead_id} enriched successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      enriched: {
        rating: place.rating,
        review_count: place.user_ratings_total,
        photo_count: photoReferences.length,
        city: addressParts.city,
        state: addressParts.state,
        industry_template: industryTemplate,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
