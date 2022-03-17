import { LinkifyPipe } from './linkify.pipe';

describe('LinkifyPipe', () => {
  it('create an instance', () => {
    const pipe = new LinkifyPipe();
    expect(pipe).toBeTruthy();
  });

  it('should wrap url as markdown link', () => {
    const linkUrl = 'http://example.net/';
    const anchorTagString = `[${linkUrl}](${linkUrl})`;
    const pipe = new LinkifyPipe();
    expect(pipe.transform(linkUrl)).toEqual(anchorTagString);
  });
});
