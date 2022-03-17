import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { distinctUntilKeyChanged, filter, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import {
  InferenceHistoryStoreActions,
  ModelStoreSelectors,
  ProjectStoreActions,
  ProjectStoreSelectors,
  RootStoreState,
  TargetMachineSelectors,
} from '@store';
import { selectRunningProfilingPipelinesPerProjectMap } from '@store/inference-history-store/inference-history.selectors';
import { selectTargetMachineEntities } from '@store/target-machine-store/target-machine.selectors';
import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { selectSelectedProjectModel } from '@store/model-store/model.selectors';
import { loadSelectedModelById } from '@store/model-store/model.actions';

import { MasterDetailComponent } from '@shared/components/master-detail/master-detail.component';

@Component({
  selector: 'wb-model-projects',
  templateUrl: './model-projects.component.html',
  styleUrls: ['./model-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelProjectsComponent implements OnInit {
  @Input() modelId: number = null;

  public projectItems$ = this.store$.select(ProjectStoreSelectors.selectAllProjectItems);
  public devicesNamesMap$ = this.store$.select(TargetMachineSelectors.selectAllDevicesNamesMap);
  public projectItemsIsLoading$ = this.store$.select(ProjectStoreSelectors.selectProjectIsLoading);

  public runningProfilingPipeLinePerProjectMap$ = this.store$.select(selectRunningProfilingPipelinesPerProjectMap);
  public runningInt8CalibrationPipeLinePerProjectMap$ = this.store$.select(
    ProjectStoreSelectors.selectRunningInt8CalibrationPipelinesPerProjectMap
  );

  public targetMachineEntities$ = this.store$.select(selectTargetMachineEntities);

  public projectStatusNames = ProjectStatusNames;

  public archivedTipMessage = this.messagesService.getHint('common', 'archivedProjectWarning', {
    actionName: 'Create button',
  });

  public selectedProject$ = this.store$.select(ProjectStoreSelectors.selectSelectedProject).pipe(
    filter((projectItem) => !!projectItem),
    distinctUntilKeyChanged('id')
  );
  public selectedProjectModel$ = this.store$.select(selectSelectedProjectModel);

  public readonly model$ = this.store$.select(ModelStoreSelectors.getSelectedModelByParam);

  public selectedTargetMachine$ = this.selectedProject$.pipe(
    filter((project) => !!project),
    switchMap((project) => this.store$.select(TargetMachineSelectors.selectTargetMachineById, project.targetId))
  );

  @ViewChild('wbMasterDetail') projectDetails: MasterDetailComponent;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private messagesService: MessagesService,
    private store$: Store<RootStoreState.State>
  ) {}

  ngOnInit() {
    this.store$.dispatch(ProjectStoreActions.loadProjectsForModel({ modelId: this.modelId }));
  }

  handleDeleteProjectItem({ id }: ProjectItem): void {
    this.store$.dispatch(ProjectStoreActions.deleteProject({ id }));
  }

  handleCancelInference(jobId: number): void {
    this.store$.dispatch(InferenceHistoryStoreActions.cancelInference({ jobId }));
  }

  goToCompare(project: ProjectItem): void {
    this.router.navigate(['/dashboard', project.originalModelId, 'compare'], {
      queryParams: { projectA: project.id },
      relativeTo: this.route,
    });
  }

  createProject(): void {
    this.router.navigate(['/projects/create'], {
      queryParams: {
        modelId: this.modelId,
      },
    });
  }

  handleOpenProject({ id, originalModelId }: ProjectItem): void {
    this.store$.dispatch(ProjectStoreActions.selectProject({ id }));
    this.router.navigate(['/dashboard', originalModelId, 'projects', id]);
  }

  onProjectDetailsSelected({ id, modelId }: ProjectItem): void {
    this.store$.dispatch(ProjectStoreActions.selectProject({ id }));
    this.store$.dispatch(loadSelectedModelById({ id: modelId }));
    this.projectDetails.detailsSidenav.open();
  }

  onProjectDetailsReset(): void {
    this.store$.dispatch(ProjectStoreActions.resetSelectedProject());
  }
}
