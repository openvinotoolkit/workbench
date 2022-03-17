import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { SharedModule } from '@shared/shared.module';

import { InformationCollectionComponent } from './information-collection.component';

describe('InformationCollectionComponent', () => {
  let component: InformationCollectionComponent;
  let fixture: ComponentFixture<InformationCollectionComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [Angulartics2Module.forRoot(), SharedModule, RouterTestingModule],
        declarations: [InformationCollectionComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InformationCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
