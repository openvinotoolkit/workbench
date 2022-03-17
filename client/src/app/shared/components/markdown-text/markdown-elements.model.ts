export enum MarkdownElementTypesEnum {
  TEXT = 'text',
  INLINE_LINK = 'inline_link',
  LINE_BREAK = 'line_break',
}

type MarkdownElementType =
  | MarkdownElementTypesEnum.TEXT
  | MarkdownElementTypesEnum.INLINE_LINK
  | MarkdownElementTypesEnum.LINE_BREAK;

class MarkdownBaseElement {
  private _elementType: MarkdownElementType;

  constructor(elementType: MarkdownElementType) {
    this._elementType = elementType;
  }

  get elementType(): MarkdownElementType {
    return this._elementType;
  }
}

export class MarkdownText extends MarkdownBaseElement {
  public text: string;

  constructor(text: string) {
    super(MarkdownElementTypesEnum.TEXT);
    this.text = text;
  }
}

export class MarkdownLineBreak extends MarkdownBaseElement {
  constructor() {
    super(MarkdownElementTypesEnum.LINE_BREAK);
  }
}

export class MarkdownInlineLink extends MarkdownBaseElement {
  href: string;
  text: string;

  constructor(href: string, text: string) {
    super(MarkdownElementTypesEnum.INLINE_LINK);
    this.href = href;
    this.text = text;
  }
}

export type MarkdownElement = MarkdownText | MarkdownInlineLink | MarkdownLineBreak;
