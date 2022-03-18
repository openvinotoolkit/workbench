import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { IMarkdownParser, IMarkdownParserOptions } from './index';

@Injectable({
  providedIn: 'root',
})
export class MarkdownService {
  private _parser: IMarkdownParser;

  constructor(private readonly _sanitizer: DomSanitizer) {}

  private async _loadParser() {
    this._parser = await import('./markdown');
  }

  async parse(text: string, options?: IMarkdownParserOptions): Promise<string> {
    await this._loadParser();
    const markdown = await this._parser.parse(text, options);
    return this._sanitizer.sanitize(SecurityContext.HTML, markdown);
  }
}
