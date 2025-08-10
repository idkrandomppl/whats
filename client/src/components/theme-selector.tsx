import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";

const themes = [
  { name: "Light", value: "light", icon: "fas fa-sun" },
  { name: "Dark", value: "dark", icon: "fas fa-moon" },
  { name: "Blue", value: "blue", icon: "fas fa-water" },
  { name: "Green", value: "green", icon: "fas fa-leaf" },
  { name: "Purple", value: "purple", icon: "fas fa-gem" },
  { name: "Orange", value: "orange", icon: "fas fa-fire" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <i className="fas fa-palette"></i>
          Theme
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value as any)}
            className={`gap-2 ${theme === themeOption.value ? "bg-accent" : ""}`}
          >
            <i className={themeOption.icon}></i>
            {themeOption.name}
            {theme === themeOption.value && <i className="fas fa-check ml-auto"></i>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
