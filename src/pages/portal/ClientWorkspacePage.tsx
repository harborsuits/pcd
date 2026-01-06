import { useParams, Navigate } from "react-router-dom";

/**
 * ClientWorkspacePage - DEPRECATED: Now redirects to WorkspacePage
 * All client-facing functionality is handled in /w/:token
 */
export default function ClientWorkspacePage() {
  const { token } = useParams<{ token: string }>();
  
  // Redirect to unified workspace
  return <Navigate to={`/w/${token}`} replace />;
}
