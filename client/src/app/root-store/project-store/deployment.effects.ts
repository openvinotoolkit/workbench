import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { saveAs } from 'file-saver';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { select, Store } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';

import { DeployRestService } from '@core/services/api/rest/deploy-rest.service';
import { CommonRestService } from '@core/services/api/rest/common-rest.service';

import * as DeployActions from '@store/project-store/deployment.actions';
import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';
import { loadProjectsForModel, selectProject, updateProjectParameters } from '@store/project-store/project.actions';
import { DeploymentPipelineSocketDTO, ProjectItem } from '@store/project-store/project.model';
import { selectProjectItemsMap, selectSelectedProject } from '@store/project-store/project.selectors';
import { RootStoreState } from '@store/index';

import { DeviceTargets } from '@shared/models/device';

@Injectable()
export class DeploymentEffects {
  startDeploy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeployActions.startDeployment),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      switchMap(([{ config }, tabId]) => {
        return this.deployRestService.startDeployment$(config, tabId).pipe(
          map(({ jobId, message, artifactId, targets, modelName, operatingSystem }) => {
            if (jobId === null && message) {
              const name = generatePackageName(targets, modelName, operatingSystem);
              return DeployActions.downloadDeploymentPackage({
                id: config.projectId,
                artifactId,
                name,
              });
            } else {
              return DeployActions.startDeploymentSuccess();
            }
          }),
          catchError((error) => of(DeployActions.startDeploymentFailure({ error })))
        );
      })
    )
  );

  onSocketMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeployActions.onDeploySocketMessage),
      map((action) => action.message),
      withLatestFrom(
        this.store$.pipe(select(selectProjectItemsMap)),
        this.store$.pipe(select(selectSelectedProject)),
        this.store$.select<string>(GlobalsStoreSelectors.selectTabId),
        (message, projectItemsMap, selectedProject, socketTabId) =>
          [message, projectItemsMap, selectedProject, socketTabId] as [
            DeploymentPipelineSocketDTO,
            Dictionary<ProjectItem>,
            ProjectItem,
            string
          ]
      ),
      filter(([message, , selectedProject, socketTabId]) => !!selectedProject && message.jobs[0].tabId === socketTabId),
      switchMap(([message, projectItemsMap, selectedProject]) => {
        const { status } = message;
        const deploymentJob = message.jobs[0];
        const { projectId, targets, modelName, operatingSystem, artifactId } = deploymentJob;

        if (message.status.progress === 100) {
          const name = generatePackageName(targets, modelName, operatingSystem);
          return [
            DeployActions.downloadDeploymentPackage({
              id: projectId,
              artifactId,
              name,
            }),
          ];
        }
        const deployProject = projectItemsMap[projectId];
        if (!deployProject) {
          return [loadProjectsForModel({ modelId: selectedProject.originalModelId }), selectProject({ id: projectId })];
        }
        return [
          updateProjectParameters({
            id: deployProject.id,
            status,
          }),
        ];
      })
    )
  );

  downloadDeploymentPackage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeployActions.downloadDeploymentPackage),
      switchMap(({ id, artifactId, name }) => {
        const path = `${artifactId}.tar.gz`;
        return this.commonRestService.downloadFile$(path).pipe(
          map((res) => {
            saveAs(res.body, name);
            return DeployActions.deploymentPackageDownloadSuccess({ id });
          })
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private deployRestService: DeployRestService,
    private commonRestService: CommonRestService,
    private store$: Store<RootStoreState.State>
  ) {}
}

function generatePackageName(targets: DeviceTargets[], modelName: string | null, operatingSystem: string): string {
  const devices = targets.join('_');
  const includesModel = modelName ? `with_model_${modelName}` : 'w_o_model';
  return `${operatingSystem}_deployment_package_${devices}_${includesModel}.tar.gz`;
}
