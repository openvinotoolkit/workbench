import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';
import { RatioBarComponent } from '@shared/components/ratio-bar/ratio-bar.component';
import { DropAreaDirective } from '@shared/directives/drop-area.directive';

import { InferenceResultsComponent } from './inference-results.component';
import { ClassificationResultsComponent } from './classification-results/classification-results.component';
import { ColorCodingService } from '../../../../color-coding.service';

describe('InferenceResultsComponent', () => {
  let component: InferenceResultsComponent;
  let fixture: ComponentFixture<InferenceResultsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          SharedModule,
          NoopAnimationsModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [InferenceResultsComponent, ClassificationResultsComponent, RatioBarComponent, DropAreaDirective],
        providers: [ColorCodingService, MessagesService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InferenceResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
