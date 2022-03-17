import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PageWithActionsComponent } from './page-with-actions.component';

describe('PageWithActionsComponent', () => {
  let component: PageWithActionsComponent;
  let fixture: ComponentFixture<PageWithActionsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PageWithActionsComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PageWithActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
