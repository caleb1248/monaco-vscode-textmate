import * as vsctm from 'vscode-textmate';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import * as monaco from 'monaco-editor-core';
import wasmURL from 'vscode-oniguruma/release/onig.wasm?url';

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

async function createTokensProvider(
  scopeName: string
): Promise<monaco.languages.EncodedTokensProvider> {
  const grammar = await registry.loadGrammar(scopeName);

  if (!grammar) {
    throw new Error('Failed to load grammar');
  }

  // We use `EncodedTokensProvider` here
  // If you want non-encoded tokens, you can use `grammar.tokenizeLine`
  // However, non-encoded textmate tokens aren't directly compatible with Monaco tokens
  // To fix this, you must convert the tokens yourself
  // This file here has most of the code https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/textMate/common/TMHelper.ts
  const result: monaco.languages.EncodedTokensProvider = {
    getInitialState() {
      return vsctm.INITIAL;
    },
    tokenize(line, state: vsctm.StateStack) {
      let result = grammar.tokenizeLine(line, state);
      let tokens: monaco.languages.IToken[] = [];
      for (let i = 0; i < result.tokens.length; i++) {
        let token = result.tokens[i];
        tokens.push({
          startIndex: token.startIndex,
          scopes: token.scopes.join(' '),
        });
      }
      return { tokens, endState: result.ruleStack };
    },
    tokenizeEncoded(line, state: vsctm.StateStack) {
      const lineTokens = grammar.tokenizeLine2(line, state);

      return {
        tokens: lineTokens.tokens,
        endState: lineTokens.ruleStack,
      };
    },
  };

  return result;
}

class TokensProviderCache {
  private cache: Record<string, monaco.languages.EncodedTokensProvider> = {};

  constructor(editor: any) {
    editor._themeService.onDidColorThemeChange((theme: any) => {
      this.updateTheme(theme);
    });
    this.updateTheme(editor._themeService.getColorTheme());
    console.log('created!');
  }

  private updateTheme(theme: any) {
    registry.setTheme({
      settings: (theme.themeData as monaco.editor.IStandaloneThemeData).rules.map((rule) => ({
        scope: rule.token,
        settings: {
          foreground: rule.foreground,
          background: rule.background,
          fontStyle: rule.fontStyle,
        },
      })),
    });
  }

  async getTokensProvider(scopeName: string): Promise<monaco.languages.EncodedTokensProvider> {
    if (!this.cache[scopeName]) {
      this.cache[scopeName] = await createTokensProvider(scopeName);
      console.log('created tokens provider for', scopeName);
    }

    return this.cache[scopeName];
  }
}

export { TokensProviderCache };
