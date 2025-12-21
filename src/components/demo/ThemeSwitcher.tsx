import { themes, ThemeId } from "./themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThemeSwitcherProps {
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const themeList = Object.values(themes);

  return (
    <TooltipProvider>
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2 text-center">Pick your look</p>
          <div className="flex gap-1">
            {themeList.map((theme) => (
              <Tooltip key={theme.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onThemeChange(theme.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      currentTheme === theme.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {theme.name}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-48">
                  <p className="text-xs">{theme.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
