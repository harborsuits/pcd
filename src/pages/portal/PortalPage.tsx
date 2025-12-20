import { useParams } from "react-router-dom";

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">
          Client Portal (Token: {token?.slice(0, 8)}...)
        </p>
      </div>
    </div>
  );
}
