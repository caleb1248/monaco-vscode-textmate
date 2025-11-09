import * as monaco from 'monaco-editor';
import { languages } from 'monaco-editor';

interface IRegExp {
  pattern: string;
  flags?: string;
}

interface IIndentationRules {
  decreaseIndentPattern: string | IRegExp;
  increaseIndentPattern: string | IRegExp;
  indentNextLinePattern?: string | IRegExp;
  unIndentedLinePattern?: string | IRegExp;
}

interface IEnterAction {
  indent: 'none' | 'indent' | 'indentOutdent' | 'outdent';
  appendText?: string;
  removeText?: number;
}

interface IOnEnterRule {
  beforeText: string | IRegExp;
  afterText?: string | IRegExp;
  previousLineText?: string | IRegExp;
  action: IEnterAction;
}

/**
 * Serialized form of a language configuration
 */
export interface ILanguageConfiguration {
  comments?: monaco.languages.CommentRule;
  brackets?: monaco.languages.CharacterPair[];
  autoClosingPairs?: Array<
    monaco.languages.CharacterPair | monaco.languages.IAutoClosingPairConditional
  >;
  surroundingPairs?: Array<monaco.languages.CharacterPair | monaco.languages.IAutoClosingPair>;
  colorizedBracketPairs?: Array<monaco.languages.CharacterPair>;
  wordPattern?: string | IRegExp;
  indentationRules?: IIndentationRules;
  folding?: {
    offSide?: boolean;
    markers?: {
      start?: string | IRegExp;
      end?: string | IRegExp;
    };
  };
  autoCloseBefore?: string;
  onEnterRules?: IOnEnterRule[];
}

const langConfig: ILanguageConfiguration = {
  // Note that this file should stay in sync with 'javascript-language-basics/javascript-language-configuration.json'
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['${', '}'],
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    {
      open: '{',
      close: '}',
    },
    {
      open: '[',
      close: ']',
    },
    {
      open: '(',
      close: ')',
    },
    {
      open: "'",
      close: "'",
      notIn: ['string', 'comment'],
    },
    {
      open: '"',
      close: '"',
      notIn: ['string'],
    },
    {
      open: '`',
      close: '`',
      notIn: ['string', 'comment'],
    },
    {
      open: '/**',
      close: ' */',
      notIn: ['string'],
    },
  ],
  surroundingPairs: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
    ["'", "'"],
    ['"', '"'],
    ['`', '`'],
    ['<', '>'],
  ].map(([open, close]) => ({ open, close })),
  colorizedBracketPairs: [
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
    ['<', '>'],
  ],
  autoCloseBefore: ';:.,=}])>` \n\t',
  folding: {
    markers: {
      start: '^\\s*//\\s*#?region\\b',
      end: '^\\s*//\\s*#?endregion\\b',
    },
  },
  wordPattern: {
    pattern:
      '(-?\\d*\\.\\d\\w*)|([^\\`\\@\\~\\!\\%\\^\\&\\*\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\\'\\"\\,\\.\\<\\>/\\?\\s]+)',
  },
  indentationRules: {
    decreaseIndentPattern: {
      pattern: '^\\s*[\\}\\]\\)].*$',
    },
    increaseIndentPattern: {
      pattern: '^.*(\\{[^}]*|\\([^)]*|\\[[^\\]]*)$',
    },
    // e.g.  * ...| or */| or *-----*/|
    unIndentedLinePattern: {
      pattern:
        '^(\\t|[ ])*[ ]\\*[^/]*\\*/\\s*$|^(\\t|[ ])*[ ]\\*/\\s*$|^(\\t|[ ])*\\*([ ]([^\\*]|\\*(?!/))*)?$',
    },
    indentNextLinePattern: {
      pattern: '^((.*=>\\s*)|((.*[^\\w]+|\\s*)((if|while|for)\\s*\\(.*\\)\\s*|else\\s*)))$',
    },
  },
  onEnterRules: [
    {
      // e.g. /** | */
      beforeText: {
        pattern: '^\\s*/\\*\\*(?!/)([^\\*]|\\*(?!/))*$',
      },
      afterText: {
        pattern: '^\\s*\\*/$',
      },
      action: {
        indent: 'indentOutdent',
        appendText: ' * ',
      },
    },
    {
      // e.g. /** ...|
      beforeText: {
        pattern: '^\\s*/\\*\\*(?!/)([^\\*]|\\*(?!/))*$',
      },
      action: {
        indent: 'none',
        appendText: ' * ',
      },
    },
    {
      // e.g.  * ...|
      beforeText: {
        pattern: '^(\\t|[ ])*\\*([ ]([^\\*]|\\*(?!/))*)?$',
      },
      previousLineText: {
        pattern: '(?=^(\\s*(/\\*\\*|\\*)).*)(?=(?!(\\s*\\*/)))',
      },
      action: {
        indent: 'none',
        appendText: '* ',
      },
    },
    {
      // e.g.  */|
      beforeText: {
        pattern: '^(\\t|[ ])*[ ]\\*/\\s*$',
      },
      action: {
        indent: 'none',
        removeText: 1,
      },
    },
    {
      // e.g.  *-----*/|
      beforeText: {
        pattern: '^(\\t|[ ])*[ ]\\*[^/]*\\*/\\s*$',
      },
      action: {
        indent: 'none',
        removeText: 1,
      },
    },
    {
      beforeText: {
        pattern: '^\\s*(\\bcase\\s.+:|\\bdefault:)$',
      },
      afterText: {
        pattern: '^(?!\\s*(\\bcase\\b|\\bdefault\\b))',
      },
      action: {
        indent: 'indent',
      },
    },
    {
      // Decrease indentation after single line if/else if/else, for, or while
      previousLineText: '^\\s*(((else ?)?if|for|while)\\s*\\(.*\\)\\s*|else\\s*)$',
      // But make sure line doesn't have braces or is not another if statement
      beforeText: '^\\s+([^{i\\s]|i(?!f\\b))',
      action: {
        indent: 'outdent',
      },
    },
    // Indent when pressing enter from inside ()
    {
      beforeText: '^.*\\([^\\)]*$',
      afterText: '^\\s*\\).*$',
      action: {
        indent: 'indentOutdent',
        appendText: '\t',
      },
    },
    // Indent when pressing enter from inside {}
    {
      beforeText: '^.*\\{[^\\}]*$',
      afterText: '^\\s*\\}.*$',
      action: {
        indent: 'indentOutdent',
        appendText: '\t',
      },
    },
    // Indent when pressing enter from inside []
    {
      beforeText: '^.*\\[[^\\]]*$',
      afterText: '^\\s*\\].*$',
      action: {
        indent: 'indentOutdent',
        appendText: '\t',
      },
    },
    // Add // when pressing enter from inside line comment
    {
      beforeText: '(?<!\\\\|\\w:)//\\s*\\S',
      afterText: '^(?!\\s*$).+',
      action: {
        indent: 'none',
        appendText: '// ',
      },
    },
  ],
};

function convertPattern(pattern: string | IRegExp): RegExp;
function convertPattern(pattern: undefined): undefined;
function convertPattern(pattern: string | IRegExp | undefined): RegExp | undefined;

function convertPattern(pattern: string | IRegExp | undefined): RegExp | undefined {
  if (!pattern) return;
  if (typeof pattern === 'string') {
    return new RegExp(pattern);
  } else {
    return new RegExp(pattern.pattern, pattern.flags);
  }
}

function convertPair(
  pair: monaco.languages.CharacterPair | monaco.languages.IAutoClosingPairConditional
): monaco.languages.IAutoClosingPairConditional {
  if (Array.isArray(pair)) {
    return { open: pair[0], close: pair[1] };
  } else {
    return pair;
  }
}

function convertOnEnterRule(rule: IOnEnterRule): monaco.languages.OnEnterRule {
  let indentAction: monaco.languages.IndentAction;
  switch (rule.action.indent) {
    case 'indent':
      indentAction = monaco.languages.IndentAction.Indent;
      break;
    case 'indentOutdent':
      indentAction = monaco.languages.IndentAction.IndentOutdent;
      break;
    case 'none':
      indentAction = monaco.languages.IndentAction.None;
      break;
    case 'outdent':
      indentAction = monaco.languages.IndentAction.Outdent;
      break;
  }

  return {
    beforeText: convertPattern(rule.beforeText)!,
    afterText: convertPattern(rule.afterText),
    previousLineText: convertPattern(rule.previousLineText),
    action: {
      indentAction,
      appendText: rule.action.appendText,
      removeText: rule.action.removeText,
    },
  };
}

function convertLanguageConfiguration(
  config: ILanguageConfiguration
): monaco.languages.LanguageConfiguration {
  return {
    comments: config.comments,
    brackets: config.brackets,
    wordPattern: convertPattern(config.wordPattern),
    indentationRules: config.indentationRules && {
      decreaseIndentPattern: convertPattern(config.indentationRules.decreaseIndentPattern),
      increaseIndentPattern: convertPattern(config.indentationRules.increaseIndentPattern),
      indentNextLinePattern: convertPattern(config.indentationRules.indentNextLinePattern),
      unIndentedLinePattern: convertPattern(config.indentationRules.unIndentedLinePattern),
    },
    onEnterRules: config.onEnterRules?.map(convertOnEnterRule),
    autoClosingPairs: config.autoClosingPairs?.map(convertPair),
    surroundingPairs: config.surroundingPairs?.map(convertPair),
    colorizedBracketPairs: config.colorizedBracketPairs,
    autoCloseBefore: config.autoCloseBefore,
    folding: config.folding && {
      markers:
        config.folding.markers && config.folding.markers.start && config.folding.markers.end
          ? {
              start: convertPattern(config.folding.markers.start)!,
              end: convertPattern(config.folding.markers.end)!,
            }
          : undefined,
      offSide: config.folding.offSide,
    },
  };
}

// const converted: monaco.languages.LanguageConfiguration = convertLanguageConfiguration(langConfig);

const languageConfiguration = {
  wordPattern:
    /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/,

  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },

  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],

  onEnterRules: [
    {
      // e.g. /** | */
      beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
      afterText: /^\s*\*\/$/,
      action: {
        indentAction: languages.IndentAction.IndentOutdent,
        appendText: ' * ',
      },
    },
    {
      // e.g. /** ...|
      beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
      action: {
        indentAction: languages.IndentAction.None,
        appendText: ' * ',
      },
    },
    {
      // e.g.  * ...|
      beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
      action: {
        indentAction: languages.IndentAction.None,
        appendText: '* ',
      },
    },
    {
      // e.g.  */|
      beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
      action: {
        indentAction: languages.IndentAction.None,
        removeText: 1,
      },
    },
  ],

  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
    { open: '`', close: '`', notIn: ['string', 'comment'] },
    { open: '/**', close: ' */', notIn: ['string'] },
  ],

  folding: {
    markers: {
      start: new RegExp('^\\s*//\\s*#?region\\b'),
      end: new RegExp('^\\s*//\\s*#?endregion\\b'),
    },
  },
};
monaco.languages.register({
  id: 'typescript',
  extensions: ['.ts', '.tsx', '.cts', '.mts'],
  aliases: ['TypeScript', 'ts', 'typescript'],
  mimetypes: ['text/typescript'],
});

monaco.languages.register({
  id: 'javascript',
  extensions: ['.js', '.jsx', '.cjs', '.mjs'],
  aliases: ['JavaScript', 'js', 'javascript'],
  mimetypes: ['text/javascript'],
});

export default languageConfiguration;
