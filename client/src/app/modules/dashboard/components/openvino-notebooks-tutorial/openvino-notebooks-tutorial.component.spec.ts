import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { OpenvinoNotebooksTutorialComponent } from './openvino-notebooks-tutorial.component';

describe('OpenvinoNotebooksTutorialComponent', () => {
  let component: OpenvinoNotebooksTutorialComponent;
  let fixture: ComponentFixture<OpenvinoNotebooksTutorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, Angulartics2Module.forRoot()],
      declarations: [OpenvinoNotebooksTutorialComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenvinoNotebooksTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
