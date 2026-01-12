export type Threadable = {
  id: string;
  created_at: string;
  parent_comment_id?: string | null;
  thread_root_id?: string | null;
  last_activity_at?: string | null;
};

/**
 * Returns true if the comment is a root (top-level) comment.
 * A root comment has no parent_comment_id.
 */
export function isRootComment(comment: Threadable): boolean {
  return !comment.parent_comment_id;
}

/**
 * Returns true if the comment is a reply.
 * A reply has a parent_comment_id.
 */
export function isReplyComment(comment: Threadable): boolean {
  return !!comment.parent_comment_id;
}

/**
 * Returns the thread ID for a comment.
 * For root comments, returns their own ID.
 * For replies, returns thread_root_id or parent_comment_id.
 */
export function getThreadId(comment: Threadable): string {
  return comment.thread_root_id ?? comment.parent_comment_id ?? comment.id;
}

/**
 * Groups replies under their thread root.
 * Falls back to parent_comment_id if thread_root_id is null.
 * Returns a Map of threadRootId -> sorted replies (oldest first).
 */
export function buildReplyMap<T extends Threadable>(comments: T[]): Map<string, T[]> {
  const replyMap = new Map<string, T[]>();

  for (const c of comments) {
    if (!c.parent_comment_id) continue;

    const threadId = c.thread_root_id ?? c.parent_comment_id;
    if (!threadId) continue;

    const list = replyMap.get(threadId) ?? [];
    list.push(c);
    replyMap.set(threadId, list);
  }

  // Sort replies chronologically (oldest first)
  for (const list of replyMap.values()) {
    list.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  return replyMap;
}

/**
 * Returns the correct parent ID to use when replying to a comment.
 * Always replies to the thread root to prevent deep nesting.
 */
export function getReplyTargetId(comment: Threadable): string {
  return comment.thread_root_id ?? comment.id;
}
