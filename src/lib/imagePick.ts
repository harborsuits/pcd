// Deterministic image picker - ensures unique, varied images per business
// Uses a seed-based approach so same business always gets same images

/**
 * Simple hash function for creating deterministic seeds from strings
 */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Pick a deterministic subset of unique items from a pool.
 * Same seed always produces same selection.
 * Different seeds tend to produce different selections.
 * 
 * @param pool - Array of items to pick from
 * @param count - Number of items to pick
 * @param seedStr - Seed string for deterministic selection
 * @returns Array of picked items (never duplicates)
 */
export function pickUnique<T>(pool: T[], count: number, seedStr: string): T[] {
  // If pool is smaller than or equal to count, return all
  if (pool.length <= count) return pool.slice(0, count);

  const seed = hashString(seedStr);
  const picked: T[] = [];
  const used = new Set<number>();

  // Start at a seed-determined position
  let cursor = seed % pool.length;
  
  // Step through using a prime-ish number to spread selections
  const step = 7; // Prime helps avoid clustering
  
  while (picked.length < count && used.size < pool.length) {
    if (!used.has(cursor)) {
      used.add(cursor);
      picked.push(pool[cursor]);
    }
    cursor = (cursor + step) % pool.length;
  }
  
  return picked;
}

/**
 * Create a seed string from business details for gallery image selection
 */
export function createGallerySeed(opts: {
  businessName?: string;
  city?: string;
  leadId?: string;
  templateType?: string;
}): string {
  return `${opts.businessName || ""}|${opts.city || ""}|${opts.leadId || ""}|${opts.templateType || ""}`;
}
