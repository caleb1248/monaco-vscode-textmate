import "./style.css";
import "./workers";

import * as monaco from "monaco-editor";
import { TokensProviderCache, convertTheme } from "./textmate/index";
import darkPlusTheme from "./textmate/themes/dark-plus";

const editorDiv = document.createElement("div");
editorDiv.classList.add("editor");
document.getElementById("app")?.appendChild(editorDiv);
const model = monaco.editor.createModel(
  `// This is a demonstration of what textmate grammars can do, and what monaco grammars can't.

let x = 5;
const y = "hello world";

interface IMyInterface {
  foo: string;
  bar: (baz: string) => number;
}

async function add(a: number, b: number) {
  console.log('calculating \${a} + \${b}');
  return a + b;
}

function subtract(a: number, b: number) {
  console.log('calculating \${a} + \${b}');
  return a + b;
}

export { add, add as default }`,
  "typescript",
  monaco.Uri.file("main.ts")
);

// Register textmate theme
const theme = convertTheme(darkPlusTheme);

monaco.editor.defineTheme("dark-plus", theme);

const editor = monaco.editor.create(editorDiv, {
  model,
  tabSize: 2,
  theme: "dark-plus",
});

// Begin textmate stuff

const cache = new TokensProviderCache(editor);

monaco.languages.setTokensProvider(
  "typescript",
  await cache.getTokensProvider("source.ts")
);

window.addEventListener("resize", () => editor.layout());

// @ts-ignore
window.editor = editor;
