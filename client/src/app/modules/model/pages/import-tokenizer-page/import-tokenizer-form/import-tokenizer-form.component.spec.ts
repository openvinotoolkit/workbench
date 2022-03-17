import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportTokenizerFormComponent } from './import-tokenizer-form.component';

describe('ImportTokenizerFormComponent', () => {
  let component: ImportTokenizerFormComponent;
  let fixture: ComponentFixture<ImportTokenizerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImportTokenizerFormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportTokenizerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
