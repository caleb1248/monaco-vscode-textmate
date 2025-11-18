// This file converts a vscode language configuration to a monaco language configuration
// We don't actually use this in the project because for typescript, the > sign in arrow functions turn red due to some weird bracket matching
// You can use this in your own project if you need.

import * as monaco from 'monaco-editor';

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
interface ILanguageConfiguration {
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

export type { ILanguageConfiguration };
export { convertLanguageConfiguration };
