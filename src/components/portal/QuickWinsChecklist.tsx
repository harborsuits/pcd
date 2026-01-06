import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Palette, 
  List, 
  MapPin, 
  Camera, 
  ArrowRight, 
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface QuickWin {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
}

interface QuickWinsChecklistProps {
  projectToken: string;
  onNavigate: (path: string) => void;
  onSkip: () => void;
  completedItems?: string[];
}

const QUICK_WINS: QuickWin[] = [
  {
    id: "logo_colors",
    label: "Logo & Colors",
    description: "Upload your logo or tell us your brand colors",
    icon: <Palette className="h-4 w-4" />,
    path: "phase-b?section=brand",
  },
  {
    id: "services",
    label: "Services List",
    description: "List your main services or products",
    icon: <List className="h-4 w-4" />,
    path: "phase-b?section=content",
  },
  {
    id: "service_area",
    label: "Service Area",
    description: "Where do you serve customers?",
    icon: <MapPin className="h-4 w-4" />,
    path: "phase-b?section=content",
  },
  {
    id: "photos",
    label: "Photos",
    description: "Upload work photos or we can generate them",
    icon: <Camera className="h-4 w-4" />,
    path: "phase-b?section=photos",
  },
];

export function QuickWinsChecklist({ 
  projectToken, 
  onNavigate, 
  onSkip,
  completedItems = [] 
}: QuickWinsChecklistProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleStartSelected = () => {
    // Navigate to the first selected item
    const firstSelected = QUICK_WINS.find(w => selectedItems.includes(w.id));
    if (firstSelected?.path) {
      onNavigate(`/w/${projectToken}/${firstSelected.path}`);
    } else {
      onNavigate(`/w/${projectToken}/phase-b`);
    }
  };

  const completedCount = completedItems.length;
  const remainingItems = QUICK_WINS.filter(w => !completedItems.includes(w.id));

  if (remainingItems.length === 0) {
    return null; // All done!
  }

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Help us build faster
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Optional quick wins that speed up your project. Skip if you're not ready.
        </p>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-2">
          <div className="space-y-3">
            {remainingItems.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-background cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => handleToggleItem(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.icon}</span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleStartSelected}
              disabled={selectedItems.length === 0}
              className="flex-1"
              size="sm"
            >
              {selectedItems.length > 0 
                ? `Start (${selectedItems.length} selected)`
                : "Select items to start"
              }
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>

          {completedCount > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              {completedCount} of {QUICK_WINS.length} complete
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
