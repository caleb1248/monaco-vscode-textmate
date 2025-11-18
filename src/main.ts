import './style.css';
import './workers';

import 'monaco-editor/esm/vs/editor/editor.all';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// @ts-ignore
import conf from './typescript/language-configuration.json';
import {
  convertLanguageConfiguration,
  ILanguageConfiguration,
} from './textmate/language-configuration-converter';
import { TokensProviderCache, convertTheme } from './textmate/index';
import darkPlusTheme from './textmate/themes/dark-plus.json';
import './textmate/language-configuration-converter';
import { grammarConfig } from './typescript/grammar-configuration';

const editorDiv = document.createElement('div');
editorDiv.classList.add('editor');
document.getElementById('app')?.appendChild(editorDiv);

const cache = new TokensProviderCache();
monaco.languages.registerTokensProviderFactory('typescript', {
  create: () =>
    cache.getTokensProvider(
      'source.ts',
      monaco.languages.getEncodedLanguageId('typescript'),
      grammarConfig
    ),
});

monaco.languages.onLanguageEncountered('typescript', () => {
  console.log('setting language configuration for typescript');
  monaco.languages.setLanguageConfiguration(
    'typescript',
    convertLanguageConfiguration(conf as ILanguageConfiguration)
  );
});

const model = monaco.editor.createModel(
  `// This is a demonstration of what textmate grammars can do, and what monaco grammars can't.

let x = 5;
const y = "hello world";

interface IMyInterface {
  foo: string;
  bar: (baz: string) => number;
}

async function add(a: number, b: number) {
  console.log(\`calculating \${a} + \${b}\`);
  return a + b;
}

function subtract(a: number, b: number) {
  console.log('calculating \${a} + \${b}');
  return a + b;
}

export { add, add as default }`,
  'typescript',
  monaco.Uri.file('main.ts')
);

// Register textmate theme
const theme = convertTheme(darkPlusTheme);

monaco.editor.defineTheme('dark-plus', theme);

const editor = monaco.editor.create(editorDiv, {
  model,
  tabSize: 2,
  theme: 'dark-plus',
});

// For debugging
// globalThis.monaco = monaco;
// globalThis.editor = editor;

window.addEventListener('resize', () => editor.layout());

// @ts-ignore
window.editor = editor;
