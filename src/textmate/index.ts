import * as vsctm from 'vscode-textmate';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import wasmURL from 'vscode-oniguruma/release/onig.wasm?url';
// @ts-ignore
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
// @ts-ignore
import { IStandaloneThemeService } from 'monaco-editor/esm/vs/editor/standalone/common/standaloneTheme';
// @ts-ignore
import * as builtInThemes from 'monaco-editor/esm/vs/editor/standalone/common/themes';
import { EncodedTokenAttributes } from './encodedTokenAttributes';
const themeService = StandaloneServices.get(IStandaloneThemeService);
export { convertTheme, type IVScodeTheme, type TokenColor } from './theme-converter';

// Load the wasm file for vscode-oniguruma
const wasmPromise = fetch(wasmURL)
  .then((response) => response.arrayBuffer())
  .then((buffer) => loadWASM({ data: buffer }))
  .catch((error) => console.error('Failed to load `onig.wasm`:', error));

const tmScopeToUrlMap: Record<string, string> = {
  'source.ts':
    'https://raw.githubusercontent.com/microsoft/vscode/main/extensions/typescript-basics/syntaxes/TypeScript.tmLanguage.json',
};

const registry = new vsctm.Registry({
  onigLib: wasmPromise.then(() => {
    return {
      createOnigScanner: (sources) => new OnigScanner(sources),
      createOnigString: (str) => new OnigString(str),
    };
  }),

  async loadGrammar(scopeName) {
    const url = tmScopeToUrlMap[scopeName];
    if (url) {
      const response = await fetch(url);
      const grammar = await response.text();
      return JSON.parse(grammar);
    } else {
      throw new Error(`No grammar found for scope: ${scopeName}`);
    }
  },
});

const colorToScopeMap = new Map<string, string>();

function updateTheme(theme: any) {
  // Send the current theme to the registry
  let convertedTheme = {
    settings: (theme.themeData as monaco.editor.IStandaloneThemeData).rules.map((rule) => ({
      scope: rule.token,
      settings: {
        foreground: rule.foreground,
        background: rule.background,
        fontStyle: rule.fontStyle,
      },
    })),
  };

  registry.setTheme(convertedTheme);

  // Build the color to scope map
  const themeData = theme.themeData as monaco.editor.IStandaloneThemeData;
  const rules = themeData.rules;

  if (themeData.inherit) {
    // Add built-in theme rules
    switch (themeData.base) {
      case 'vs-dark':
        rules.push(...builtInThemes.vs_dark.rules);
        break;

      case 'vs':
        rules.push(...builtInThemes.vs.rules);
        break;
      case 'hc-black':
        rules.push(...builtInThemes.hc_black.rules);
        break;
      case 'hc-light':
        rules.push(...builtInThemes.hc_light.rules);
        break;
    }
  }

  colorToScopeMap.clear();

  for (const rule of themeData.rules) {
    const color = rule.foreground;
    if (color && !colorToScopeMap.has(color)) {
      colorToScopeMap.set(color, rule.token);
    }
  }
}

updateTheme(themeService.getColorTheme());

themeService.onDidColorThemeChange((theme: any) => {
  updateTheme(theme);
});

const foregroundMask = 0b00000000111111111000000000000000;
const foregroundOffset = 15;

async function createTokensProvider(
  scopeName: string,
  languageId: number,
  config: vsctm.IGrammarConfiguration
): Promise<monaco.languages.EncodedTokensProvider> {
  const grammar = await registry.loadGrammarWithConfiguration(scopeName, languageId, config);

  if (!grammar) {
    throw new Error('Failed to load grammar');
  }

  const result: monaco.languages.EncodedTokensProvider = {
    getInitialState() {
      return vsctm.INITIAL;
    },
    tokenize(line, state: vsctm.StateStack) {
      // We supply a non-encoded tokens provider for the monaco tokens inspector to work
      let result = grammar.tokenizeLine(line, state);

      return {
        endState: result.ruleStack,
        tokens: result.tokens.map((token) => ({
          scopes: token.scopes.join(' '),
          startIndex: token.startIndex,
        })),
      };
    },
    tokenizeEncoded(line, state: vsctm.StateStack) {
      let result = grammar.tokenizeLine2(line, state);

      return { endState: result.ruleStack, tokens: result.tokens };
    },
  };

  return result;
}

class TokensProviderCache {
  private cache: Record<string, monaco.languages.EncodedTokensProvider> = {};

  /**
   * Get the corresponding TokensProvider for a given scope, or create one if it doesn't exist.
   */
  async getTokensProvider(
    scopeName: string,
    languageId: number,
    config: vsctm.IGrammarConfiguration
  ): Promise<monaco.languages.EncodedTokensProvider> {
    if (!this.cache[scopeName]) {
      this.cache[scopeName] = await createTokensProvider(scopeName, languageId, config);
      console.log('created tokens provider for', scopeName);
    }

    return this.cache[scopeName];
  }
}

export { TokensProviderCache };
