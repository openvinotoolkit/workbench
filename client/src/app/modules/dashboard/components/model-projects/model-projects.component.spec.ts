import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';
import { ProjectConverterService } from '@store/project-store/project-converter.service';

import { ModelProjectsComponent } from './model-projects.component';
import { ProjectsByModelTableComponent } from '../projects-by-model-table/projects-by-model-table.component';

describe('ModelProjectsComponent', () => {
  let component: ModelProjectsComponent;
  let fixture: ComponentFixture<ModelProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [ModelProjectsComponent, ProjectsByModelTableComponent],
      providers: [ProjectConverterService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
