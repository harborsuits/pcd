import { Monitor, Smartphone, Globe } from "lucide-react";

const HeroStatic = () => {
  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/30 rounded-full blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-lg">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-lg">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-lg">
            <Globe className="w-8 h-8 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Beautiful, responsive websites for local businesses
        </p>
      </div>
    </div>
  );
};

export default HeroStatic;
