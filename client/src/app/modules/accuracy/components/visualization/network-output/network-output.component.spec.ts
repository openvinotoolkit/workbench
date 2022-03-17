import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';
import { DropAreaDirective } from '@shared/directives/drop-area.directive';
import { ImageSelectorComponent } from '@shared/components/image-selector/image-selector.component';
import { RatioBarComponent } from '@shared/components/ratio-bar/ratio-bar.component';

import { NetworkOutputComponent } from './network-output.component';
import { ColorCodingService } from '../../../color-coding.service';
import { InferenceResultsComponent } from './inference-results/inference-results.component';
import { ErrorBlockComponent } from './error-block/error-block.component';
import { ClassificationResultsComponent } from './inference-results/classification-results/classification-results.component';
import { LabelSetsComponent } from './label-sets/label-sets.component';
import { OriginalImageControlsComponent } from './original-image-controls/original-image-controls.component';

describe('NetworkOutputComponent', () => {
  let component: NetworkOutputComponent;
  let fixture: ComponentFixture<NetworkOutputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
          NoopAnimationsModule,
          RouterTestingModule,
        ],
        declarations: [
          NetworkOutputComponent,
          ImageSelectorComponent,
          InferenceResultsComponent,
          DropAreaDirective,
          ErrorBlockComponent,
          ClassificationResultsComponent,
          OriginalImageControlsComponent,
          RatioBarComponent,
          LabelSetsComponent,
        ],
        providers: [ColorCodingService, MessagesService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkOutputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
