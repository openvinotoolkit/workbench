import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('python', python);
hljs.registerLanguage('plaintext', plaintext);

export interface IMarkdownParserOptions {
  highlight: boolean;
}

export interface IMarkdownParser {
  parse: (markdownTest: string, options?: IMarkdownParserOptions) => Promise<string>;
}

const DEFAULT_OPTIONS: IMarkdownParserOptions = {
  highlight: true,
};

export async function parse(text: string, options: IMarkdownParserOptions = DEFAULT_OPTIONS): Promise<string> {
  const noYamlHeaderText = cutYamlHeader(text);
  return marked.parse(noYamlHeaderText, options.highlight ? highlightConfig : commonConfig);
}

const commonConfig = {
  breaks: true,
};

const highlightConfig = {
  ...commonConfig,
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
};

// cut yaml header, example:
// ---
// language:
// - en
// - nl
// - de
// - fr
// - it
// - es
//
// license: mit
// ---
//
// ...
const cutYamlHeader = (markdown: string): string => {
  if (!markdown.startsWith('---')) {
    return markdown;
  }
  for (let i = 3; i < markdown.length - 5; i++) {
    if (markdown.slice(i, i + 5) === '\n---\n') {
      markdown = markdown.slice(i + 5);
      break;
    }
  }

  return markdown;
};
