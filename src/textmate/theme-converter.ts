import type { editor } from "monaco-editor";

interface IVScodeTheme {
  $schema: "vscode://schemas/color-theme";
  name?: string | undefined;
  include?: string | undefined;
  tokenColors: TokenColor[];
  colors?:
    | {
        [name: string]: string;
      }
    | undefined;
}

interface TokenColor {
  name?: string;
  scope: string[];
  settings: {
    foreground: string;
  };
}

function convertTheme(theme: IVScodeTheme): editor.IStandaloneThemeData {
  const rules = [];
  for (const rule of theme.tokenColors) {
    if (typeof rule.scope === "string") {
      rules.push({
        token: rule.scope,
        foreground: rule.settings.foreground,
      });
    } else {
      for (const scope of rule.scope) {
        rules.push({
          token: scope,
          foreground: rule.settings.foreground,
        });
      }
    }
  }

  return {
    base: "vs-dark",
    inherit: false,
    rules,
    colors: theme.colors || {},
  };
}

export { convertTheme };
export type { IVScodeTheme, TokenColor };
