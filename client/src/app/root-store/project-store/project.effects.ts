import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Action, select, Store } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { of } from 'rxjs';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { endsWith, filter as _filter, head, isEmpty, isNumber, values, without } from 'lodash';

import { ProjectsRestService } from '@core/services/api/rest/projects-rest.service';
import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { XMLGraphStoreActions, XMLGraphStoreSelectors } from '@store/xml-graph-store';

import { PipelineType } from '@shared/models/pipelines/pipeline';
import { AccuracyReportType } from '@shared/models/accuracy-analysis/accuracy-report';

import * as ProjectActions from './project.actions';
import { RootStoreState } from '../index';
import {
  selectAllProjectItems,
  selectInProgressProjectItems,
  selectProjectItemsIds,
  selectProjectItemsMap,
  selectSelectedProject,
  selectSelectedProjectId,
} from './project.selectors';
import { ProjectConverterService } from './project-converter.service';
import { ProjectItem, ProjectStatusNames } from './project.model';
import * as InferenceHistorySelectors from '../inference-history-store/inference-history.selectors';
import * as InferenceResultSelectors from '../inference-result-store/inference-result.selectors';
import {
  filterInferenceItemsPoints,
  loadInferenceHistory,
  resetInferenceHistory,
} from '../inference-history-store/inference-history.actions';
import { resetSelectedInferenceResult } from '../inference-result-store/inference-result.actions';
import { resetTaskIsRunningAction } from '../globals-store/globals.actions';

@Injectable()
export class ProjectEffects {
  loadProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.loadActiveProjects, ProjectActions.loadProjectsForModel),
      switchMap((action) => {
        const modelId = action.type === ProjectActions.loadProjectsForModel.type ? action.modelId : null;
        return this.projectsRestService.getAllProjects$(modelId).pipe(
          withLatestFrom(this.store$.select(selectInProgressProjectItems)),
          map(([projects, inProgressProjects]) => {
            const items = this.projectConverterService.getItemsListFromDtoList(projects);

            inProgressProjects.forEach((inProgressItem) => {
              const item = items.find((i) => i.id === inProgressItem.id);
              if (item && inProgressItem.status.progress > item.status.progress) {
                item.status.progress = inProgressItem.status.progress;
              }
            });
            return ProjectActions.loadProjectsSuccess({ items });
          }),
          catchError((error: Error) => of(ProjectActions.loadProjectsFailure({ error: error.message })))
        );
      })
    )
  );

  loadProjectsForProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.loadProjectsForProject),
      switchMap(({ projectId }) =>
        this.projectsRestService.getProjectInfo$(projectId).pipe(
          map(({ originalModelId }) => ProjectActions.loadProjectsForModel({ modelId: originalModelId })),
          catchError((error: Error) => of(ProjectActions.loadProjectsFailure({ error: error.message })))
        )
      )
    )
  );

  toggleExpandProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.toggleExpandProject),
      map((action) => action.id),
      withLatestFrom(this.store$.pipe(select(selectProjectItemsMap))),
      map(([id, itemsMap]: [number, { [id: number]: ProjectItem }]) => {
        const { isExpanded, children } = itemsMap[id];
        const childrenDeep = this.projectConverterService.getAllLevelsDescendants(children, itemsMap);

        const updates = [];

        const clickedItemUpdate = {
          id,
          changes: { isExpanded: !isExpanded },
        };

        updates.push(clickedItemUpdate);

        childrenDeep.forEach((childId) => {
          updates.push({
            id: childId,
            changes: {
              isVisible: !isExpanded,
              isExpanded: !isExpanded,
            },
          });
        });
        return ProjectActions.toggleExpandProjectWithChildren({ updates });
      })
    )
  );

  deleteProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.deleteProject),
      switchMap((payload) =>
        this.projectsRestService.deleteProject$(payload.id).pipe(
          map(({ id }) => ProjectActions.deleteProjectSuccess({ id })),
          catchError((error) => of(ProjectActions.deleteProjectFailure({ error })))
        )
      )
    )
  );

  deleteProjectSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.deleteProjectSuccess),
      map((action) => action.id),
      withLatestFrom(this.store$.pipe(select(selectProjectItemsMap))),
      switchMap(([id, itemsMap]: [number, Dictionary<ProjectItem>]) => {
        const projectToDelete = itemsMap[id];
        const { children } = projectToDelete;
        const childrenDeep = this.projectConverterService.getAllLevelsDescendants(children, itemsMap);
        const idsToDelete = [id, ...childrenDeep];
        const updates = [];
        idsToDelete.forEach((itemId) => {
          const { parentId } = itemsMap[itemId];
          if (!parentId) {
            return;
          }

          updates.push({
            id: parentId,
            changes: {
              children: without(itemsMap[parentId].children, itemId),
            },
          });
        });
        const actionToDispatch: Action[] = [ProjectActions.deleteProjectWithChildren({ idsToDelete, updates })];

        // Remove single task flag on delete of running project and if any task is running on its children
        let resetRunningFlag = [ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(
          projectToDelete.status.name
        );
        if (!resetRunningFlag) {
          const runningChildren = _filter(childrenDeep, (child) => {
            return [ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(itemsMap[child].status.name);
          });

          resetRunningFlag = !isEmpty(runningChildren);
        }
        if (resetRunningFlag) {
          actionToDispatch.push(resetTaskIsRunningAction());
        }
        return actionToDispatch;
      })
    )
  );

  resetInferencesOnDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.deleteProjectWithChildren),
      map((action) => action.idsToDelete),
      withLatestFrom(
        this.store$.pipe(select(InferenceHistorySelectors.selectAllInferenceItems)),
        this.store$.pipe(select(InferenceResultSelectors.selectSelectedInferenceResult))
      ),
      switchMap(([idsToDelete, inferences, inferenceResult]) => {
        const resetInferences = idsToDelete.some((id) =>
          inferences.some((inference) => inference.projectId === Number(id))
        );
        const resetInferenceResults = idsToDelete.some((id) => inferenceResult?.config.projectId === id);
        const actions: Action[] = [];

        if (resetInferences) {
          actions.push(resetInferenceHistory());
        }

        if (resetInferenceResults) {
          actions.push(resetSelectedInferenceResult());
        }

        return actions;
      })
    )
  );

  reselectProjectOnDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.deleteProjectWithChildren),
      map((action) => action.idsToDelete),
      withLatestFrom(
        this.store$.pipe(select(selectSelectedProjectId)),
        this.store$.pipe(select(selectProjectItemsIds)),
        (...params) => params
      ),
      filter(
        ([idsToDelete, selectedProjectId, existingProjectIds]) =>
          idsToDelete.includes(selectedProjectId) && !isEmpty(existingProjectIds)
      ),
      map(([idsToDelete, selectedProjectId, existingProjectIds]) =>
        ProjectActions.selectProject({ id: existingProjectIds[0] })
      )
    )
  );

  redirectToHomeWhenAllProjectsDeleted$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectActions.deleteProjectWithChildren),
        withLatestFrom(this.store$.pipe(select(selectAllProjectItems))),
        filter(([payload, projectItems]) => isEmpty(projectItems)),
        tap(() => this.router.navigate(['/']))
      ),
    { dispatch: false }
  );

  selectProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.selectProject),
      withLatestFrom(
        this.store$.pipe(select(selectSelectedProject)),
        this.store$.pipe(select(XMLGraphStoreSelectors.selectOriginalGraphId)),
        (_, projectItem, originalGraphId): [ProjectItem, number] => [projectItem, originalGraphId]
      ),
      filter(([projectItem]) => !!projectItem),
      switchMap(([{ id, modelId }, originalGraphId]) => {
        const actionsToDispatch: Action[] = [
          loadInferenceHistory({ id }),
          filterInferenceItemsPoints({ ids: [] }), // Reset filtered inference history
        ];
        // Set new original graph id for selected int8 project
        if (originalGraphId !== Number(modelId)) {
          actionsToDispatch.push(XMLGraphStoreActions.setOriginalGraphIdAction({ modelId: Number(modelId) }));
        }
        return actionsToDispatch;
      })
    )
  );

  autoSelectFirstProjectOnLoadProjectsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.loadProjectsSuccess),
      // Do not select project and load history automatically on compare page
      filter(() => !endsWith(this.router.url, '/compare') && !endsWith(this.router.url, '/inference/configuration')),
      withLatestFrom(this.store$.pipe(select(selectSelectedProjectId))),
      // Automatically select first project if none selected
      filter(([payload, selectedProjectId]) => !selectedProjectId),
      map(([payload]) => head(payload.items)),
      // Detect that projects for model are loaded, not active projects
      filter((firstProject) => firstProject && !!firstProject.execInfo),
      map((firstProject) => ProjectActions.selectProject({ id: firstProject.id }))
    )
  );

  updateProjectStatusOnAccuracySocketMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.onAccuracySocketMessage),
      map((action) => action.message),
      withLatestFrom(this.store$.pipe(select(selectProjectItemsMap))),
      switchMap(([message, projectItemsMap]) => {
        const { status, projectId } = message;
        const updatingProject = projectItemsMap[projectId];
        if (!updatingProject) {
          const { originalModelId } = head(values(projectItemsMap));
          return [ProjectActions.loadProjectsForModel({ modelId: originalModelId })];
        }
        if ([ProjectStatusNames.READY, ProjectStatusNames.RUNNING].includes(status.name)) {
          status.errorMessage = null;
        }

        return [
          ProjectActions.updateProjectParameters({
            id: updatingProject.id,
            status,
          }),
        ];
      })
    )
  );

  updateProjectAccuracyValue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectActions.onAccuracySocketMessage),
      map((action) => action.message),
      filter(
        (pipeline) =>
          [PipelineType.LOCAL_ACCURACY, PipelineType.REMOTE_ACCURACY, PipelineType.DEV_CLOUD_ACCURACY].includes(
            pipeline.type
          ) && pipeline.status.name === ProjectStatusNames.READY
      ),
      switchMap((pipeline) => this.accuracyRestService.getReports$(pipeline.projectId)),
      map((reports) => reports.find(({ reportType }) => reportType === AccuracyReportType.DATASET_ANNOTATIONS)),
      filter((report) => !!report && isNumber(report.accuracyResult)),
      map(({ projectId, accuracyResult }) =>
        ProjectActions.updateProjectParameters({ id: projectId, execInfo: { accuracy: accuracyResult } })
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private projectConverterService: ProjectConverterService,
    private projectsRestService: ProjectsRestService,
    private accuracyRestService: AccuracyRestService
  ) {}
}
