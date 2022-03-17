import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';
import { RatioBarComponent } from '@shared/components/ratio-bar/ratio-bar.component';

import { ClassificationResultsComponent } from './classification-results.component';

describe('ClassificationResultsComponent', () => {
  let component: ClassificationResultsComponent;
  let fixture: ComponentFixture<ClassificationResultsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedModule],
        declarations: [ClassificationResultsComponent, RatioBarComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassificationResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
