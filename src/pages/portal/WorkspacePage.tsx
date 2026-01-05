import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { ProjectWorkspace, type Version, type CommentData } from "@/components/portal/workspace";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function WorkspacePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);

  // Fetch prototypes (versions)
  const fetchVersions = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/prototypes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok && data.prototypes) {
        setVersions(data.prototypes);
      } else {
        setError(data.error || "Failed to load versions");
      }
    } catch (err) {
      console.error("Fetch versions error:", err);
      setError("Failed to load workspace");
    }
  }, [token]);

  // Fetch all comments
  const fetchComments = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchVersions();
      await fetchComments();
      setLoading(false);
    };
    load();
  }, [fetchVersions, fetchComments]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || versions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">
            {error || "No versions available"}
          </h2>
          <p className="text-muted-foreground">
            {error 
              ? "Please check your link and try again."
              : "There are no prototype versions to review yet."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProjectWorkspace
      token={token!}
      versions={versions}
      comments={comments}
      onRefreshComments={fetchComments}
    />
  );
}
