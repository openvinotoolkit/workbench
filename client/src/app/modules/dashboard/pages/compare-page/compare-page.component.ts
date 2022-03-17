import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { combineLatest, of, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelStoreSelectors, ProjectStoreActions, ProjectStoreSelectors, RootStoreState } from '@store';
import { ProjectItem } from '@store/project-store/project.model';
import { IInferenceResult, InferenceUtils } from '@store/inference-history-store/inference-history.model';
import { CompareStoreActions, CompareStoreSelectors } from '@store/compare-store';
import {
  ILayerTimePrecisionDistribution,
  InferenceResultModel,
} from '@store/inference-result-store/inference-result.model';

import { LayersTableService } from '../../components/model-layers-with-graphs/layers-table/layers-table.service';
import { ExecutedLayerItem } from '../../components/model-layers-with-graphs/layers-table/layers-table.model';

@Component({
  selector: 'wb-compare-page',
  templateUrl: './compare-page.component.html',
  styleUrls: ['./compare-page.component.scss'],
})
export class ComparePageComponent implements OnInit, OnDestroy {
  layerTableData: ExecutedLayerItem[];

  @ViewChild('detailsElement', { read: ElementRef }) detailsEl: ElementRef;

  firstPointLayerTimeDistribution: ILayerTimePrecisionDistribution[];
  secondPointLayerTimeDistribution: ILayerTimePrecisionDistribution[];

  showDetails = false;

  model$ = this.store$.select(ModelStoreSelectors.getSelectedModelByParam);
  projects$ = this.store$.select(ProjectStoreSelectors.selectReadyProjectItems);

  execDetails$ = this.projects$.pipe(
    filter((projects) => Boolean(projects?.length && this.inferenceResultA && this.inferenceResultB)),
    map((projects) => {
      const projectA = projects.find((p) => Number(p.id) === this.inferenceResultA.projectId);
      const projectB = projects.find((p) => Number(p.id) === this.inferenceResultB.projectId);
      return [this._getDetails(projectA, this.inferenceResultA), this._getDetails(projectB, this.inferenceResultB)];
    })
  );

  private _bestThroughputProject$ = this.projects$.pipe(
    map((projects) => projects?.slice().sort((a, b) => b.execInfo.throughput - a.execInfo.throughput)?.[0])
  );

  defaultProjectA$ = this.store$.select(ProjectStoreSelectors.getReadyCompareProjectByQueryParams, 'projectA').pipe(
    switchMap((project) => (project ? of(project) : this._bestThroughputProject$)),
    filter((v) => !!v),
    take(1)
  );
  defaultProjectB$ = this._bestThroughputProject$.pipe(
    filter((v) => !!v),
    take(1)
  );

  inferenceResultA: IInferenceResult;
  inferenceResultB: IInferenceResult;

  inferenceResultModelA$ = this.store$.select(CompareStoreSelectors.selectResultModel, 'a');
  inferenceResultModelB$ = this.store$.select(CompareStoreSelectors.selectResultModel, 'b');

  barChartType: 'throughput' | 'latency' = 'throughput';

  readonly barTypeHint = this._messagesService.hintMessages.compare.barTypeHint;

  readonly getThroughputUnit = InferenceUtils.getThroughputUnit;

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(
    private store$: Store<RootStoreState.State>,
    private layersTableService: LayersTableService,
    private _messagesService: MessagesService,
    private _cdr: ChangeDetectorRef,
    private _route: ActivatedRoute,
    private _router: Router
  ) {}

  ngOnInit() {
    this.store$
      .select(ModelStoreSelectors.getSelectedModelByParam)
      .pipe(
        filter((modelItem) => !!modelItem),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(({ id }) => this.store$.dispatch(ProjectStoreActions.loadProjectsForModel({ modelId: id })));

    combineLatest([this.inferenceResultModelA$, this.inferenceResultModelB$])
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(([first, second]) => this.buildLayersTable(first, second));
  }

  getUnderTitleHint(modelName: string): string {
    return this._messagesService.getHint('compare', 'underTitleHint', {
      modelName,
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
    this.store$.dispatch(CompareStoreActions.reset());
  }

  onInferenceResultASelection(result: IInferenceResult) {
    this.inferenceResultA = result;
    this.showDetails = false;
  }

  onInferenceResultBSelection(result: IInferenceResult) {
    this.inferenceResultB = result;
    this.showDetails = false;
  }

  buildLayersTable(first: InferenceResultModel, second: InferenceResultModel) {
    if (!first || !second) {
      this.layerTableData = null;
      return;
    }

    this.firstPointLayerTimeDistribution = first.layerTimeDistribution;
    this.secondPointLayerTimeDistribution = second.layerTimeDistribution;

    this.layerTableData = this.layersTableService.joinExecNetworksForComparison(
      first.runtimeRepresentation,
      second.runtimeRepresentation,
      first.config.projectId === second.config.projectId
    );
    this.layersTableService.setUpPrecisionFilterableColumnOptions(
      first.runtimeRepresentation,
      second.runtimeRepresentation
    );

    this.store$.dispatch(
      ProjectStoreActions.reportComparisonGA({
        modelId: first.config.originalModelId,
        projectA: first.config.projectId,
        projectB: second.config.projectId,
      })
    );
  }

  showComparisonDetails() {
    this.showDetails = true;
    this.barChartType = 'throughput';

    this.store$.dispatch(
      CompareStoreActions.loadInferenceResult({
        jobId: this.inferenceResultA.profilingJobId,
        id: this.inferenceResultA.id,
        side: 'a',
      })
    );

    this.store$.dispatch(
      CompareStoreActions.loadInferenceResult({
        jobId: this.inferenceResultB.profilingJobId,
        id: this.inferenceResultB.id,
        side: 'b',
      })
    );
  }

  goToModel() {
    this.model$.pipe(take(1)).subscribe(({ id }) => {
      this._router.navigate(['/models', id]);
    });
  }

  private _getDetails(project: ProjectItem, inferenceResult: IInferenceResult): string {
    return [
      ProjectItem.getFullProjectName(project),
      `batch: ${inferenceResult.batch}, streams: ${inferenceResult.nireq}`,
    ].join('\n');
  }
}
