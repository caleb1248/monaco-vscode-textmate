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
const themeService = StandaloneServices.get(IStandaloneThemeService);
export { convertTheme, type IVScodeTheme, type TokenColor } from './theme-converter';

const wasmPromise = fetch(wasmURL)
  .then((response) => response.arrayBuffer())
  .then((buffer) => loadWASM({ data: buffer }))
  .catch((error) => console.error('Failed to load `onig.wasm`:', error));

const scopeUrlMap: Record<string, string> = {
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
  loadGrammar(scopeName) {
    function fetchGrammar(path: string) {
      return fetch(path).then((response) => response.text());
    }

    const url = scopeUrlMap[scopeName];
    if (url) {
      return fetchGrammar(url).then((grammar) => JSON.parse(grammar));
    }

    return Promise.reject(new Error(`No grammar found for scope: ${scopeName}`));
  },
});

const colorToScope = new Map<string, string>();

function updateTheme(theme: any) {
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
  const themeData = theme.themeData as monaco.editor.IStandaloneThemeData;
  const rules = themeData.rules;
  if (themeData.inherit) {
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
  for (const rule of themeData.rules) {
    const color = rule.foreground;
    if (color && !colorToScope.has(color)) {
      colorToScope.set(color, rule.token);
    }
  }
}

updateTheme(themeService.getColorTheme());

themeService.onDidColorThemeChange((theme: any) => {
  updateTheme(theme);
});

const foregroundMask = 0b00000000111111111000000000000000;
const foregroundOffset = 15;

async function createTokensProvider(scopeName: string): Promise<monaco.languages.TokensProvider> {
  const grammar = await registry.loadGrammar(scopeName);

  if (!grammar) {
    throw new Error('Failed to load grammar');
  }

  // We use `EncodedTokensProvider` here
  // If you want non-encoded tokens, you can use `grammar.tokenizeLine`
  // However, non-encoded textmate tokens aren't directly compatible with Monaco tokens
  // To fix this, you must convert the tokens yourself
  // This file here has most of the code https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/textMate/common/TMHelper.ts
  const result: monaco.languages.TokensProvider = {
    getInitialState() {
      return vsctm.INITIAL;
    },
    tokenize(line, state: vsctm.StateStack) {
      let result = grammar.tokenizeLine2(line, state);
      const tokensLength = result.tokens.length / 2;
      const tokens: monaco.languages.IToken[] = new Array(tokensLength);
      console.log(Object.fromEntries(colorToScope));
      for (let j = 0; j < tokensLength; j++) {
        const startIndex = result.tokens[2 * j];
        const metadata = result.tokens[2 * j + 1];
        const color = (
          themeService.getColorTheme().tokenTheme.getColorMap()[
            (metadata & foregroundMask) >> foregroundOffset
          ] ?? ''
        ).toString();

        const scope = colorToScope.get(color.toUpperCase()) ?? '';
        tokens[j] = { startIndex, scopes: scope };
      }

      return { endState: result.ruleStack, tokens };
    },
  };

  return result;
}

class TokensProviderCache {
  private cache: Record<string, monaco.languages.TokensProvider> = {};

  async getTokensProvider(scopeName: string): Promise<monaco.languages.TokensProvider> {
    if (!this.cache[scopeName]) {
      this.cache[scopeName] = await createTokensProvider(scopeName);
      console.log('created tokens provider for', scopeName);
    }

    return this.cache[scopeName];
  }
}

export { TokensProviderCache };
