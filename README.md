# monaco-vscode-textmate
Making textmate grammars work in monaco-editor.
## Why?
Monaco editor uses monarch grammars instead of textmate grammars. This means that regular vscode themes won't work in monaco editor. This project lets you use textmate grammars and textmate themes in the monaco editor.
## Why not just use `monaco-textmate`, `monaco-editor-textmate`, and `monaco-vscode-textmate-theme-converter`?
- `monaco-vscode-textmate-theme-converter` runs on nodejs and needs access to the file system, which means it doesn't work in the browser.
- `vscode-textmate` now works in the browser, which means that `monaco-textmate` isn't needed.
- `monaco-editor-textmate` doesn't work with `vscode-textmate`. It's `tm-to-monaco-token` doesn't always convert the tokens correctly, so I made a custom implementation that gives more accurate results.
