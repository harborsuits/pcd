import { useParams, Navigate } from "react-router-dom";

// Old portal now redirects to the unified workspace
export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  
  if (!token) {
    return <Navigate to="/portal" replace />;
  }
  
  return <Navigate to={`/w/${token}`} replace />;
}
