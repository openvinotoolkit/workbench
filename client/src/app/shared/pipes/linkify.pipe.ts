import { Pipe, PipeTransform } from '@angular/core';

export const linkRegExp =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

@Pipe({
  name: 'linkify',
})
export class LinkifyPipe implements PipeTransform {
  transform(value: string): string {
    return this.replaceLinksWithAnchorTags(value);
  }

  private replaceLinksWithAnchorTags(text: string): string {
    if (!text) {
      return;
    }
    return text.replace(linkRegExp, '[$&]($&)');
  }
}
