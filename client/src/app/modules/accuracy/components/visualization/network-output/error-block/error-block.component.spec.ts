import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { ErrorBlockComponent } from './error-block.component';

describe('ErrorBlockComponent', () => {
  let component: ErrorBlockComponent;
  let fixture: ComponentFixture<ErrorBlockComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedModule],
        declarations: [ErrorBlockComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
