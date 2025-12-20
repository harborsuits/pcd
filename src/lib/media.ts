// Media Proxy utilities - all media should go through our secure proxy

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MEDIA_PROXY_URL = `${SUPABASE_URL}/functions/v1/media`;

/**
 * Returns a proxied URL for media content.
 * - If url is a UUID (file_id), uses the /media/:id endpoint
 * - Otherwise uses /media?url=<encoded> for external URLs
 */
export function proxyMediaUrl(url: string): string {
  if (!url) return '';
  
  // If it's already our media proxy, return as-is
  if (url.includes('/functions/v1/media')) return url;
  
  // If it's a file ID (UUID format), use direct path
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(url)) {
    return `${MEDIA_PROXY_URL}/${url}`;
  }
  
  // Otherwise proxy the full URL
  return `${MEDIA_PROXY_URL}?url=${encodeURIComponent(url)}`;
}

/**
 * Check if a URL points to an image based on extension
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
  return imageExtensions.test(url);
}

/**
 * Extract image URLs from message content
 */
export function extractImageUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|avif))/gi;
  const matches = content.match(urlRegex);
  return matches || [];
}
