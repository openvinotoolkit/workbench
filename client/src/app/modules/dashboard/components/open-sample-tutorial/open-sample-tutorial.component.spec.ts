import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { OpenSampleTutorialComponent } from './open-sample-tutorial.component';

describe('OpenSampleTutorialComponent', () => {
  let component: OpenSampleTutorialComponent;
  let fixture: ComponentFixture<OpenSampleTutorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, Angulartics2Module.forRoot()],
      declarations: [OpenSampleTutorialComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenSampleTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
