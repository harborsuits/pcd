import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        
        {/* Test link for routing verification */}
        <div className="mt-8 space-y-2">
          <Link 
            to="/d/test-acme-plumbing-2024/acme-plumbing" 
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Acme Demo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
