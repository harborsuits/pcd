// Photo proxy for Google Places photos - keeps API key server-side

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const photoReference = url.searchParams.get("ref");
    const maxWidth = url.searchParams.get("w") || "800";

    if (!photoReference) {
      return new Response("Missing photo reference", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googleApiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response("Photo service unavailable", { 
        status: 503, 
        headers: corsHeaders 
      });
    }

    // Validate maxWidth to prevent abuse
    const width = Math.min(Math.max(parseInt(maxWidth) || 400, 100), 1600);

    const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
    googleUrl.searchParams.set("photo_reference", photoReference);
    googleUrl.searchParams.set("maxwidth", width.toString());
    googleUrl.searchParams.set("key", googleApiKey);

    console.log(`Proxying photo: ${photoReference.slice(0, 20)}... at width ${width}`);

    const photoRes = await fetch(googleUrl.toString(), {
      redirect: "follow",
    });

    if (!photoRes.ok) {
      console.error("Google photo fetch failed:", photoRes.status);
      return new Response("Photo not available", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const imageBuffer = await photoRes.arrayBuffer();
    const contentType = photoRes.headers.get("content-type") || "image/jpeg";

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error("Photo proxy error:", error);
    return new Response("Photo service error", { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
