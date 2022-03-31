import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { IMarkdownParser, IMarkdownParserOptions } from './markdown-parser';

@Injectable()
export class MarkdownService {
  // The class `markdown-body` comes from `highlight.js` extension for `marked`.
  readonly markdownBodyClassName = 'markdown-body';

  private _parser: IMarkdownParser;

  constructor(private readonly _sanitizer: DomSanitizer) {}

  private async _loadParser() {
    this._parser = await import('./markdown-parser');
  }

  async parse(text: string, options?: IMarkdownParserOptions): Promise<string> {
    await this._loadParser();
    const markdown = await this._parser.parse(text, options);
    return this._sanitizer.sanitize(SecurityContext.HTML, markdown);
  }
}
