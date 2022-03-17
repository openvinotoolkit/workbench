import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { split, compact } from 'lodash';

import { isLinkInternal } from '@shared/directives/external-link.directive';

import {
  MarkdownElement,
  MarkdownElementTypesEnum,
  MarkdownInlineLink,
  MarkdownLineBreak,
  MarkdownText,
} from './markdown-elements.model';

const markdownElementsRegexp = /((?:\[(?:[^\[\]]+)]\((?:[^\s()]+)\))|(?:[^\S\r\n]*[\r\n]{1}))/g;

const markdownLinkRegexp = /\[([^\[\]]+)\]\(([^)]+)/;

const markdownLineBreakRegexp = /([^\S\r\n]*[\r\n]{1})/;

@Component({
  selector: 'wb-markdown-text',
  templateUrl: './markdown-text.component.html',
  styleUrls: ['./markdown-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownTextComponent {
  @Input() set text(value: string) {
    if (!value) {
      return;
    }
    this.setMarkdownElements(value);
  }

  public markdownElements: MarkdownElement[] = [];

  public MarkdownElementTypesEnum = MarkdownElementTypesEnum;

  public isLinkInternal = isLinkInternal;

  setMarkdownElements(value: string): void {
    const splitTextAndLinks = compact(split(value, markdownElementsRegexp));
    this.markdownElements = splitTextAndLinks.map((splitText: string) => {
      const linkMatchResult = markdownLinkRegexp.exec(splitText);
      if (linkMatchResult) {
        const [, text, href] = linkMatchResult;
        return new MarkdownInlineLink(href, text);
      }
      if (markdownLineBreakRegexp.test(splitText)) {
        return new MarkdownLineBreak();
      }
      return new MarkdownText(splitText);
    });
  }

  trimInternalLinkQueryParams(internalLink: string): string {
    return internalLink.split('?')[0];
  }

  getInternalLinkQueryParams(internalLink: string): { [key: string]: string | number } {
    if (!internalLink) {
      return {};
    }
    const [, queryParamsString] = internalLink.split('?');
    if (!queryParamsString) {
      return {};
    }
    const queryParamsMap = {};
    new URLSearchParams(queryParamsString).forEach((value, key) => {
      queryParamsMap[key] = value;
    });
    return queryParamsMap;
  }
}
