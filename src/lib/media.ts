// Media Proxy utilities - all media should go through our secure proxy

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MEDIA_PROXY_URL = `${SUPABASE_URL}/functions/v1/media`;

/**
 * Returns a proxied URL for media content.
 * - If input is a UUID (file_id), uses /media/:id?token=<token> (token required)
 * - Otherwise uses /media?url=<encoded> for external URLs
 * 
 * @param input - Either a file UUID or an external URL
 * @param projectToken - Required for file IDs, optional for external URLs
 */
export function proxyMediaUrl(input: string, projectToken?: string): string {
  if (!input) return '';
  
  // If it's already our media proxy, return as-is
  if (input.includes('/functions/v1/media')) return input;
  
  // If it's a file ID (UUID format), use direct path with token
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) {
    if (!projectToken) {
      console.warn('[proxyMediaUrl] File ID requires projectToken');
      return '';
    }
    return `${MEDIA_PROXY_URL}/${input}?token=${encodeURIComponent(projectToken)}`;
  }
  
  // Otherwise proxy the full URL (no token needed for external URLs)
  return `${MEDIA_PROXY_URL}?url=${encodeURIComponent(input)}`;
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
 * Check if a content type is an image
 */
export function isImageType(contentType: string): boolean {
  if (!contentType) return false;
  return contentType.toLowerCase().startsWith('image/');
}

/**
 * Extract image URLs from message content
 */
export function extractImageUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|avif))/gi;
  const matches = content.match(urlRegex);
  return matches || [];
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
  if (isImageType(fileType)) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  return '📎';
}
