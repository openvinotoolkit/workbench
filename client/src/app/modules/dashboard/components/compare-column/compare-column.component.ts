import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';

import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilKeyChanged, filter, map, takeUntil } from 'rxjs/operators';

import { RootStoreState } from '@store';
import {
  OptimizationAlgorithm,
  optimizationAlgorithmNamesMap,
  OptimizationAlgorithmPresetNames,
  optimizationJobNamesMap,
  OptimizationJobTypes,
  ProjectItem,
} from '@store/project-store/project.model';
import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { CompareStoreActions, CompareStoreSelectors } from '@store/compare-store';
import { CompareSide } from '@store/compare-store/compare.state';

@Component({
  selector: 'wb-compare-column',
  templateUrl: './compare-column.component.html',
  styleUrls: ['./compare-column.component.scss'],
})
export class CompareColumnComponent implements OnInit, OnDestroy {
  private _selectedProject: ProjectItem;
  @Input() set selectedProject(value: ProjectItem) {
    this._selectedProject = value;
    this.selectedProjectControl.setValue(value);
  }

  get selectedProject(): ProjectItem {
    return this._selectedProject;
  }

  private _projects: ProjectItem[] = [];
  @Input() set projects(value: ProjectItem[]) {
    this._projects = value.slice().sort((a, b) => b.execInfo.throughput - a.execInfo.throughput);
  }

  get projects(): ProjectItem[] {
    return this._projects;
  }

  @Input() side: CompareSide;

  @Output() selectInferenceResult = new EventEmitter<IInferenceResult>();

  selectedProjectControl = new UntypedFormControl(null, [Validators.required]);

  selectedInferenceHistory: IInferenceResult;

  inferenceList$: Observable<IInferenceResult[]>;
  inferenceNormalizationList$ = this.store$.select(CompareStoreSelectors.selectAllReadyInferencesList);

  isInferenceListLoading$: Observable<boolean>;
  isInferenceResultLoading$: Observable<boolean>;

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(private store$: Store<RootStoreState.State>) {
    // load new inference list on new project id selection
    // set null inference history
    this.selectedProjectControl.valueChanges
      .pipe(
        filter((v) => !!v),
        distinctUntilKeyChanged('id'),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((project: ProjectItem) => {
        this._selectedProject = project;
        this.onExperimentSelect(null);
        this.store$.dispatch(CompareStoreActions.loadInferenceList({ projectId: Number(project.id), side: this.side }));
      });
  }

  ngOnInit() {
    this.inferenceList$ = this.store$.select(CompareStoreSelectors.selectReadyInferenceList, this.side);
    this.isInferenceListLoading$ = this.store$.select(CompareStoreSelectors.isInferenceListLoading, this.side);
    this.isInferenceResultLoading$ = this.store$.select(CompareStoreSelectors.isInferenceResultLoading, this.side);

    // disable control on loading
    combineLatest([this.isInferenceListLoading$, this.isInferenceResultLoading$])
      .pipe(
        map(([a, b]) => a || b),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((isLoading) =>
        isLoading ? this.selectedProjectControl.disable() : this.selectedProjectControl.enable()
      );

    // autoselect best inference history
    this.inferenceList$.pipe(takeUntil(this._unsubscribe$)).subscribe((inferences) => {
      const isSelected =
        this.selectedInferenceHistory && inferences.find((v) => v.id === this.selectedInferenceHistory.id);
      if (!inferences.length || isSelected) {
        return;
      }

      const bestPoint = inferences.slice().sort((a, b) => b.throughput - a.throughput)[0];
      this.onExperimentSelect(bestPoint);
    });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  getProjectTitle(project: ProjectItem): string {
    const { configParameters } = project;

    let optimizationParameters = '';

    if (configParameters.optimizationType === OptimizationJobTypes.INT_8) {
      optimizationParameters += `${optimizationAlgorithmNamesMap[configParameters.algorithm]}`;
      if (configParameters.algorithm === OptimizationAlgorithm.ACCURACY_AWARE) {
        optimizationParameters += ` ${configParameters.threshold}%`;
      }
      optimizationParameters += `, ${OptimizationAlgorithmPresetNames[configParameters.preset]}`;
    }

    let optimization = `Optimization: ${optimizationJobNamesMap[configParameters.optimizationType] || 'None'}`;

    if (optimizationParameters) {
      optimization += ` (${optimizationParameters})`;
    }

    const target = `Target: ${project.targetName} ${project.deviceName}`;

    const validationDataset = `Dataset: ${project.datasetName}`;

    const throughput = `Best Throughput: ${project.execInfo.throughput.toFixed(2)} ${project.execInfo.throughputUnit}`;

    return `${target}, ${optimization}, ${validationDataset}, ${throughput}`;
  }

  onExperimentSelect(point: IInferenceResult) {
    this.selectedInferenceHistory = point;
    this.selectInferenceResult.emit(point);
  }

  compareProjects(a: ProjectItem, b: ProjectItem): boolean {
    return a.id === b.id;
  }
}
