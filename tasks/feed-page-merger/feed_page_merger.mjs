/**
 * Merge synthetic feed pages offline; see SPEC.md.
 * @param {{posts: {id:string,createdAt:string,updatedAt:string,[key:string]:unknown}[],nextCursor:string|null}[]} pages
 * @returns {{id:string,createdAt:string,updatedAt:string,[key:string]:unknown}[]}
 */
export function mergeFeedPages(pages) {
  if (!pages || pages.length === 0) return [];

  const byId = new Map();

  for (const page of pages) {
    if (!page || !Array.isArray(page.posts)) continue;
    for (const post of page.posts) {
      if (!post || typeof post.id !== 'string' || !post.id) continue;
      const existing = byId.get(post.id);
      if (!existing) {
        byId.set(post.id, post);
      } else {
        const existingTime = Date.parse(existing.updatedAt);
        const newTime = Date.parse(post.updatedAt);
        if (newTime > existingTime) {
          byId.set(post.id, post);
        }
        // if equal or older, keep the first encountered (already in map)
      }
    }
  }

  const winners = Array.from(byId.values());

  winners.sort((a, b) => {
    const aCreated = Date.parse(a.createdAt);
    const bCreated = Date.parse(b.createdAt);
    if (aCreated !== bCreated) {
      return bCreated - aCreated; // descending
    }
    // id ascending, ASCII
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  return winners;
}
