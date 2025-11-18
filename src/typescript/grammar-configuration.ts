import type * as vsctm from 'vscode-textmate';

// see https://github.com/microsoft/vscode/blob/main/extensions/typescript-basics/package.json
export const grammarConfig: vsctm.IGrammarConfiguration = {
  unbalancedBracketSelectors: [
    'keyword.operator.relational',
    'storage.type.function.arrow',
    'keyword.operator.bitwise.shift',
    'meta.brace.angle',
    'punctuation.definition.tag',
    'keyword.operator.assignment.compound.bitwise.ts',
  ],
  balancedBracketSelectors: ['*'],
};
