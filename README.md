# monaco-vscode-textmate

Making textmate grammars work in monaco-editor.

## Why?

Monaco editor uses monarch grammars instead of textmate grammars. This means that regular vscode themes won't work in monaco editor. This project lets you use textmate grammars and textmate themes in the monaco editor.

## How does it work?

- It leverages [`vscode-textmate`](https://github.com/microsoft/vscode-textmate) and [`vscode-oniguruma`](https://github.com/microsoft/vscode-oniguruma) to tokenize each line.
- A vscode theme is converted to a monaco editor theme and used as the theme for the editor.

## How do I get the vscode themes?

Go to the vscode command palette and select `Developer: Generate Color Theme From Current Settings`. Make sure to remove the comments from the color theme JSON.
