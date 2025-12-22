import { themes, ThemeId, getTradeAwareThemeInfo } from "./themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTradeIcon } from "@/lib/tradeIcons";

interface ThemeSwitcherProps {
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  templateType?: string;
}

export function ThemeSwitcher({ currentTheme, onThemeChange, templateType = "default" }: ThemeSwitcherProps) {
  const themeList = Object.values(themes);
  const TradeIcon = getTradeIcon(templateType);

  return (
    <TooltipProvider>
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <TradeIcon className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs text-muted-foreground">Pick your look</p>
          </div>
          <div className="flex gap-1">
            {themeList.map((theme) => {
              const tradeInfo = getTradeAwareThemeInfo(theme.id, templateType);
              return (
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
                      {tradeInfo.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-48">
                    <p className="text-xs">{tradeInfo.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
