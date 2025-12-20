import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        
        {/* Test links for routing verification */}
        <div className="mt-8 space-y-4">
          <div>
            <Link 
              to="/d/test-acme-plumbing-2024/acme-plumbing" 
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Acme Demo
            </Link>
          </div>
          <div>
            <Link 
              to="/p/test-acme-plumbing-2024" 
              className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Go to Acme Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
