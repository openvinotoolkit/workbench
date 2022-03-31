import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ChangeDetectionStrategy } from '@angular/core';

import { MaterialModule } from '@shared/material.module';
import { MarkdownTextModule } from '@shared/components/markdown-text/markdown-text.module';

import { MarkdownTextComponent } from './markdown-text.component';

describe('MarkdownTextComponent', () => {
  let component: MarkdownTextComponent;
  let fixture: ComponentFixture<MarkdownTextComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, MarkdownTextModule, MaterialModule],
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
});
