import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { IMarkdownParser, IMarkdownParserOptions } from './index';

// todo: proposal to move all markdown logic to a module with a service and a component
// component template `<div class="markdown-body" [innerHTML]="readme"></div>`
@Injectable({
  providedIn: 'root',
})
export class MarkdownService {
  // The class `markdown-body` comes from `highlight.js` extension for `marked`.
  readonly markdownBodyClassName = 'markdown-body';

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
