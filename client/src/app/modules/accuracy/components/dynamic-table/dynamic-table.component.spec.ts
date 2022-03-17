import { ComponentFixture, TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { IPage } from '@core/services/api/rest/accuracy.service';
import { MessagesService } from '@core/services/common/messages.service';

import { DynamicTableComponent } from './dynamic-table.component';
import { EntitiesDataSource } from './entities-data-source';

describe('DynamicTableComponent', () => {
  let component: DynamicTableComponent;
  let fixture: ComponentFixture<DynamicTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DynamicTableComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<DynamicTableComponent>(DynamicTableComponent);
    component = fixture.componentInstance;
    component.columns = [];
    component.dataSource = new EntitiesDataSource<object>(() => of({} as IPage<object>));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
