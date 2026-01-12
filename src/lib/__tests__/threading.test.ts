import { describe, it, expect } from "vitest";
import { buildReplyMap, getReplyTargetId } from "../threading";

describe("buildReplyMap", () => {
  it("groups replies under thread_root_id", () => {
    const comments = [
      { id: "root", created_at: "2026-01-01T00:00:00Z", parent_comment_id: null, thread_root_id: null },
      { id: "r1", created_at: "2026-01-01T00:01:00Z", parent_comment_id: "root", thread_root_id: "root" },
      { id: "r2", created_at: "2026-01-01T00:02:00Z", parent_comment_id: "r1", thread_root_id: "root" },
    ];

    const map = buildReplyMap(comments);
    expect(map.get("root")?.map(c => c.id)).toEqual(["r1", "r2"]);
  });

  it("falls back to parent_comment_id when thread_root_id is null", () => {
    const comments = [
      { id: "root", created_at: "2026-01-01T00:00:00Z", parent_comment_id: null, thread_root_id: null },
      { id: "r1", created_at: "2026-01-01T00:01:00Z", parent_comment_id: "root", thread_root_id: null },
    ];

    const map = buildReplyMap(comments);
    expect(map.get("root")?.map(c => c.id)).toEqual(["r1"]);
  });

  it("sorts replies chronologically (oldest first)", () => {
    const comments = [
      { id: "root", created_at: "2026-01-01T00:00:00Z", parent_comment_id: null, thread_root_id: null },
      { id: "r2", created_at: "2026-01-01T00:02:00Z", parent_comment_id: "root", thread_root_id: "root" },
      { id: "r1", created_at: "2026-01-01T00:01:00Z", parent_comment_id: "root", thread_root_id: "root" },
    ];

    const map = buildReplyMap(comments);
    expect(map.get("root")?.map(c => c.id)).toEqual(["r1", "r2"]);
  });

  it("returns empty map for comments with no replies", () => {
    const comments = [
      { id: "root", created_at: "2026-01-01T00:00:00Z", parent_comment_id: null, thread_root_id: null },
    ];

    const map = buildReplyMap(comments);
    expect(map.size).toBe(0);
  });
});

describe("getReplyTargetId", () => {
  it("returns thread_root_id when present", () => {
    const comment = { id: "reply", created_at: "", parent_comment_id: "root", thread_root_id: "root" };
    expect(getReplyTargetId(comment)).toBe("root");
  });

  it("returns comment id when thread_root_id is null (root comment)", () => {
    const comment = { id: "root", created_at: "", parent_comment_id: null, thread_root_id: null };
    expect(getReplyTargetId(comment)).toBe("root");
  });
});
