import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HuggingfaceModelZooDataSource } from '@shared/models/model-zoo-data-source/huggingface-model-zoo-data-source';

import { CardGridComponent } from './card-grid.component';

describe('CardGridComponent', () => {
  let component: CardGridComponent<unknown>;
  let fixture: ComponentFixture<CardGridComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardGridComponent);
    component = fixture.componentInstance;
    component.dataSource = new HuggingfaceModelZooDataSource();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
