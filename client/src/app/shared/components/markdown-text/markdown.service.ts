import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { IMarkdownParserOptions, parse } from './markdown-parser';

@Injectable()
export class MarkdownService {
  // The class `markdown-body` comes from `highlight.js` extension for `marked`.
  readonly markdownBodyClassName = 'markdown-body';

  constructor(private readonly _sanitizer: DomSanitizer) {}

  async parse(text: string, options?: IMarkdownParserOptions): Promise<string> {
    const markdown = await parse(text, options);
    return this._sanitizer.sanitize(SecurityContext.HTML, markdown);
  }
}
