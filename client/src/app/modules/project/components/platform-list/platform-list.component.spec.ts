import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';

import { PlatformListComponent } from './platform-list.component';

describe('PlatformListComponent', () => {
  let component: PlatformListComponent;
  let fixture: ComponentFixture<PlatformListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [BrowserAnimationsModule, RouterTestingModule, SharedModule],
        declarations: [PlatformListComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatformListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
