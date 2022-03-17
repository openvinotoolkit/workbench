import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MasterDetailComponent } from './master-detail.component';
import { LayersTableModule } from '../../../modules/dashboard/components/model-layers-with-graphs/layers-table/layers-table.module';

describe('MasterDetailComponent', () => {
  let component: MasterDetailComponent;
  let fixture: ComponentFixture<MasterDetailComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [NoopAnimationsModule, LayersTableModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
