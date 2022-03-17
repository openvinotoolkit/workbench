import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { CoreModule } from '@core/core.module';

import { HeaderComponent } from './header.component';
import { HeaderModule } from './header.module';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, CoreModule, HeaderModule, Angulartics2Module.forRoot()],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
