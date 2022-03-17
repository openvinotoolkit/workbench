import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { cloneDeep } from 'lodash';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { mockModelItemList } from '@store/model-store/model.reducer.spec';

import { SharedModule } from '@shared/shared.module';

import { ModelsListComponent } from './models-list.component';

describe('ModelsListComponent', () => {
  let component: ModelsListComponent;
  let fixture: ComponentFixture<ModelsListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          RouterTestingModule,
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [ModelsListComponent],
        providers: [],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelsListComponent);
    component = fixture.componentInstance;
    component.models = mockModelItemList;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select row', () => {
    spyOn(component.selected, 'emit');

    component.selectRow(mockModelItemList[0]);

    expect(component.selected.emit).toHaveBeenCalled();
  });

  it('should skip in progress model selection', () => {
    spyOn(component.selected, 'emit');

    const inProgressModel = cloneDeep(mockModelItemList[0]);
    inProgressModel.status.name = ProjectStatusNames.RUNNING;

    component.selectRow(inProgressModel);

    expect(component.selected.emit).not.toHaveBeenCalled();
  });
});
