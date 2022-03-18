export interface IMarkdownParserOptions {
  highlight: boolean;
}

export interface IMarkdownParser {
  parse: (markdownTest: string, options?: IMarkdownParserOptions) => Promise<string>;
}
