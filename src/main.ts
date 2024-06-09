import './style.css';
import './workers';

import * as monaco from 'monaco-editor';
import { TokensProviderCache, convertTheme } from './textmate/index';
import darkPlusTheme from './textmate/themes/dark-plus';

// import eruda from 'eruda';
// eruda.init();

const editorDiv = document.createElement('div');
editorDiv.classList.add('editor');
document.getElementById('app')?.appendChild(editorDiv);
const model = monaco.editor.createModel(
  'hii',
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

// Begin textmate stuff

const cache = new TokensProviderCache(editor);

monaco.languages.setTokensProvider(
  'typescript',
  await cache.getTokensProvider('source.ts')
);

window.addEventListener('resize', () => editor.layout());

// @ts-ignore
window.editor = editor;
