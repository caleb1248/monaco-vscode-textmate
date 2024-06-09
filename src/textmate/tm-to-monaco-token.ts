// Taken from zikaari/monaco-editor-textmate, modified for my use case, and fixed a bug.

// as described in issue: https://github.com/NeekSandhu/monaco-textmate/issues/5
export const TMToMonacoToken = (themeTokens: string[], scopes: string[]) => {
  let scopeName = '';

  for (let i = scopes[0].length - 1; i >= 0; i -= 1) {
    const char = scopes[0][i];
    if (char === '.') {
      break;
    }

    scopeName = char + scopeName;
  }

  for (let i = scopes.length - 1; i >= 0; i -= 1) {
    const scope = scopes[i];

    for (let i = scope.length - 1; i >= 0; i -= 1) {
      const char = scope[i];
      if (char === '.') {
        const token = scope.slice(0, i);

        // In the original monaco-editor-textmate, it checked that the token wasn't the default color.
        // However, this will fail if a theme color is the same as the default color.
        // So instead, we pass in a themeTokens array and check if the token is in the array.
        if (themeTokens.includes(token + '.' + scopeName))
          return token + '.' + scopeName;

        if (themeTokens.includes(token)) return token;
      }
    }
  }

  return '';
};
