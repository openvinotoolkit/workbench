import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MarkdownTextComponent } from '@shared/components/markdown-text/markdown-text.component';

import { TipComponent } from './tip.component';

describe('TooltipComponent', () => {
  let component: TipComponent;
  let fixture: ComponentFixture<TipComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        declarations: [TipComponent, MarkdownTextComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
