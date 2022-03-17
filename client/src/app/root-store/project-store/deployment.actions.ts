import { createAction, props } from '@ngrx/store';

import { DeploymentConfig, DeploymentPipelineSocketDTO } from '@store/project-store/project.model';
import { ErrorState } from '@store/state';

export const startDeployment = createAction('[Deployment] Start Deployment', props<{ config: DeploymentConfig }>());
export const startDeploymentSuccess = createAction('[Deployment] Start Deployment Success');

export const startDeploymentFailure = createAction(
  '[Deployment] Start Deployments Failure',
  props<{ error: ErrorState }>()
);

export const onDeploySocketMessage = createAction(
  '[Deployment] On Deploy Socket Message',
  props<{ message: DeploymentPipelineSocketDTO }>()
);

export const downloadDeploymentPackage = createAction(
  '[Deployment] Download Deployment Package',
  props<{ id: number; artifactId: number; name: string }>()
);

export const deploymentPackageDownloadSuccess = createAction(
  '[Deployment] Download Deployment Package Success',
  props<{ id: number }>()
);
