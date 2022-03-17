import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { StoreModule } from '@ngrx/store';

import { DatasetsService } from '@core/services/api/rest/datasets.service';

import { RootStoreState } from '@store';

import { GeneralAugmentationSectionComponent } from './general-augmentation-section.component';

describe('GeneralAugmentationSectionComponent', () => {
  let component: GeneralAugmentationSectionComponent;
  let fixture: ComponentFixture<GeneralAugmentationSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [GeneralAugmentationSectionComponent],
      providers: [DatasetsService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralAugmentationSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
