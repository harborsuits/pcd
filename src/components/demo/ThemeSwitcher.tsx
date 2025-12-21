import { themes, ThemeId } from "./themes";

interface ThemeSwitcherProps {
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const themeList = Object.values(themes);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-full px-2 py-1 flex gap-1 shadow-lg">
        {themeList.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentTheme === theme.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={theme.description}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );
}
