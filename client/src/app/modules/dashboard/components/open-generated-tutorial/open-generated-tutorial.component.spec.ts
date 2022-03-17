import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { OpenGeneratedTutorialComponent } from './open-generated-tutorial.component';

describe('OpenGeneratedTutorialComponent', () => {
  let component: OpenGeneratedTutorialComponent;
  let fixture: ComponentFixture<OpenGeneratedTutorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, Angulartics2Module.forRoot()],
      declarations: [OpenGeneratedTutorialComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenGeneratedTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
