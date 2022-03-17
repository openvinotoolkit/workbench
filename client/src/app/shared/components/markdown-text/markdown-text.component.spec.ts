import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RouterLinkWithHref } from '@angular/router';

import { MarkdownTextComponent } from './markdown-text.component';
import { MarkdownInlineLink, MarkdownLineBreak, MarkdownText } from './markdown-elements.model';

describe('MarkdownTextComponent', () => {
  let component: MarkdownTextComponent;
  let fixture: ComponentFixture<MarkdownTextComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        declarations: [MarkdownTextComponent],
      })
        .overrideComponent(MarkdownTextComponent, {
          set: {
            // https://github.com/angular/angular/issues/12313
            changeDetection: ChangeDetectionStrategy.Default,
          },
        })
        .compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should transform string with external link to elements array', () => {
    const startString = 'The side bar includes a';
    const link = {
      href: 'http://example.com',
      text: 'Example external link',
      markdownString: function () {
        return `[${this.text}](${this.href})`;
      },
    };
    const endString = ' Cheatsheet, full Reference, and Help.';
    component.text = startString + link.markdownString() + endString;
    expect(component.markdownElements).toEqual([
      new MarkdownText(startString),
      new MarkdownInlineLink(link.href, link.text),
      new MarkdownText(endString),
    ]);
  });

  it('should transform string with internal link and query params to elements array', () => {
    const startString = 'The side bar includes a';
    const linkPath = '/configuration/run-configuration';
    const link = {
      href: `${linkPath}?modelId=1&datasetId=2`,
      text: 'Example internal link',
      markdownString: function () {
        return `[${this.text}](${this.href})`;
      },
    };
    const endString = ' Cheatsheet, full Reference, and Help.';
    component.text = startString + link.markdownString() + endString;
    fixture.detectChanges();
    const internalLinkDebugElement = fixture.debugElement.query(By.css('a[data-test-id="internal-link"]'));
    expect(internalLinkDebugElement).toBeTruthy();
    const routerLinkInstance = internalLinkDebugElement.injector.get(RouterLinkWithHref);
    expect(routerLinkInstance['commands']).toEqual([linkPath]);
    expect(routerLinkInstance.queryParams).toEqual({ modelId: '1', datasetId: '2' });
  });

  it('should transform string with linebreaks (including multiple)', () => {
    const startString = 'First line.';
    const endString = 'Second line.';
    component.text = [startString, endString].join('\n\n\n');
    expect(component.markdownElements).toEqual([
      new MarkdownText(startString),
      new MarkdownLineBreak(),
      new MarkdownLineBreak(),
      new MarkdownLineBreak(),
      new MarkdownText(endString),
    ]);
  });
});
