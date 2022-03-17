import { Injectable, NgZone } from '@angular/core';

import { Action } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { Manager as SocketManager } from 'socket.io-client';
import { ManagerOptions } from 'socket.io-client/build/manager';

import { BackendFeedService } from '@core/services/common/backend-feed.service';

import { onProfilingSocketMessage } from '@store/inference-history-store/inference-history.actions';
import { onUploadModelSocket, startModelArchivingSocket } from '@store/model-store/model.actions';
import { ModelArchivingSocketDTO } from '@store/model-store/model.model';
import { onDeploySocketMessage } from '@store/project-store/deployment.actions';
import { onAccuracySocketMessage } from '@store/project-store/project.actions';
import {
  DeploymentPipelineSocketDTO,
  ExportProjectPipelineSocketDTO,
  InferenceReportSocketDTO,
  ProjectReportSocketDTO,
} from '@store/project-store/project.model';
import { DownloadItemSocketDTO } from '@store/globals-store/download-log.model';
import * as DownloadLogActions from '@store/globals-store/download-log.actions';
import * as ExportProjectActions from '@store/project-store/export-project.actions';
import * as ExportReportActions from '@store/project-store/export-report.actions';
import * as ExportInferenceResultStoreActions from '@store/inference-result-store/export-inference-report.actions';
import { PipelineActions } from '@store/pipelines-store';
import { InferenceTestImageStoreActions } from '@store/inference-test-image-store';
import * as Int8Actions from '@store/project-store/int8-calibration.actions';
import { DatasetStoreActions } from '@store/dataset-store';
import { IAccuracyPipeline } from '@store/accuracy-analysis-store/accuracy-analysis-store.models';
import { TokenizerActions } from '@store/tokenizer-store';
import { ModelStoreActions } from '@store';

import { UploadDatasetSocketDTO, UploadModelSocketDTO } from '@shared/models/dto/upload-socket-message-dto';
import { IConfigureTargetPipeline } from '@shared/models/pipelines/target-machines/configure-target-pipeline';
import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';
import { IInferenceTestImagePipeline } from '@shared/models/pipelines/inference-test-image-pipeline';
import { ITokenizer } from '@shared/models/tokenizer/tokenizer';
import { IConfigurePipeline } from '@shared/models/pipelines/configure-pipeline';

import { ConnectionService } from '../connection.service';

export interface FeedSocketMessage {
  code: number;
  details: {
    jobId: number;
  };
  message: string;
}

enum SocketNamespaces {
  DEFAULT = '',
  ACCURACY = 'accuracy',
  FEED = 'feed',
  DEPLOYMENT = 'deployment',
  DOWNLOAD = 'download',
  PROFILING = 'profiling',
  OPTIMIZATION = 'optimization',
  UPLOAD = 'upload',
  LOG = 'log',
  REMOTE_TARGET = 'remote_target',
  INFERENCE = 'inference',
  EXPORT_PROJECT_REPORT = 'export_project_report',
  EXPORT_INFERENCE_REPORT = 'export_inference_report',
  EXPORT_PROJECT = 'export_project',
  CONFIGURE_MODEL = 'configure_model',
}

enum SocketEvents {
  CONNECT = 'connect',
  ACCURACY = 'accuracy',
  EVENTS = 'events',
  DEPLOYMENT = 'deployment',
  DOWNLOAD = 'download',
  PROFILING = 'profiling',
  INFERENCE_TEST_IMAGE = 'inference_test_image',
  INT8 = 'int8',
  DATASET = 'dataset',
  TOKENIZER = 'tokenizer',
  MODEL = 'model',
  SETUP = 'setup_target',
  PING = 'ping_target',
  CONFIGURE_MODEL = 'configure_model',
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socketActionsList$: Observable<Observable<Action>[]>;

  private readonly wsURI: string;

  private socketManager: SocketManager;

  private disconnect$: Subject<void>;

  private readonly sioDefaultPath = 'socket.io';

  constructor(
    private connectionService: ConnectionService,
    private ngZone: NgZone,
    private backendFeedService: BackendFeedService
  ) {
    this.wsURI = this.connectionService.socketPrefix;
  }

  public connect(rejectUnauthorized: boolean = true): void {
    // Prevent socket connection duplication
    if (this.socketManager) {
      return;
    }
    this.disconnect$ = new Subject<void>();
    const sioOptions: Partial<ManagerOptions> = {
      transports: ['websocket'],
      path: `${new URL(this.wsURI).pathname}${this.sioDefaultPath}`,
      rejectUnauthorized,
      reconnectionAttempts: 5,
      closeOnBeforeunload: false,
    } as Partial<ManagerOptions>;
    this.ngZone.runOutsideAngular(() => {
      this.socketManager = new SocketManager(this.wsURI, sioOptions);
    });
    this.socketActionsList$ = this.getSocketMessage$<void>(SocketEvents.CONNECT).pipe(
      map(() => this.getActionsForSocketMessages())
    );
  }

  public disconnect() {
    this.socketManager = null;
    this.disconnect$.next();
    this.disconnect$.complete();
  }

  private getSocketMessage$<T>(
    event: SocketEvents,
    namespace: SocketNamespaces = SocketNamespaces.DEFAULT
  ): Observable<T> {
    return new Observable<T>((observer) => {
      const socket = this.socketManager.socket(`/${namespace}`);
      socket.on(event, (message: T) => {
        this.ngZone.run(() => {
          observer.next(message);
        });
      });
      return () => socket.close(); // Close socket on observable complete
    }).pipe(takeUntil(this.disconnect$));
  }

  private getActionsForSocketMessages(): Observable<Action>[] {
    // Backend feed socket messages are not dispatched as actions
    this.getSocketMessage$(SocketEvents.EVENTS, SocketNamespaces.FEED).subscribe((message: FeedSocketMessage) =>
      this.backendFeedService.handleMessage(message)
    );

    // Accuracy socket message to action stream
    const accuracyMessage$ = this.getSocketMessage$<IAccuracyPipeline>(
      SocketEvents.ACCURACY,
      SocketNamespaces.ACCURACY
    ).pipe(map((message) => onAccuracySocketMessage({ message })));

    // Deployment socket message to action stream
    const deploymentMessage$ = this.getSocketMessage$<DeploymentPipelineSocketDTO>(
      SocketEvents.DEPLOYMENT,
      SocketNamespaces.DEPLOYMENT
    ).pipe(map((message) => onDeploySocketMessage({ message })));

    // Download socket message to action stream
    const downloadMessage$ = this.getSocketMessage$<ModelArchivingSocketDTO>(
      SocketEvents.DOWNLOAD,
      SocketNamespaces.DOWNLOAD
    ).pipe(map((message) => startModelArchivingSocket(message)));

    // Local and remote INT8 socket message to action stream
    const int8CalibrationMessage$ = this.getSocketMessage$<IInt8CalibrationPipeline>(
      SocketEvents.INT8,
      SocketNamespaces.OPTIMIZATION
    ).pipe(map((message) => Int8Actions.onInt8CalibrationPipelineSocketMessage({ message })));

    // Dataset upload socket message to action stream
    const datasetUploadMessage$ = this.getSocketMessage$<UploadDatasetSocketDTO>(
      SocketEvents.DATASET,
      SocketNamespaces.UPLOAD
    ).pipe(map((message) => DatasetStoreActions.onUploadDatasetSocket({ data: message })));

    // Model upload socket message to action stream
    const modelUploadMessage$ = this.getSocketMessage$<UploadModelSocketDTO>(
      SocketEvents.MODEL,
      SocketNamespaces.UPLOAD
    ).pipe(map((message) => onUploadModelSocket({ data: message })));

    // Log download socket message to action stream
    const logDownloadMessage$ = this.getSocketMessage$<DownloadItemSocketDTO>(
      SocketEvents.DOWNLOAD,
      SocketNamespaces.LOG
    ).pipe(map((message) => DownloadLogActions.OnDownloadLogSocketAction(message)));

    // Project report export socket message to action stream
    const projectReportMessage$ = this.getSocketMessage$<ProjectReportSocketDTO>(
      SocketEvents.DOWNLOAD,
      SocketNamespaces.EXPORT_PROJECT_REPORT
    ).pipe(map((message) => ExportReportActions.onExportProjectReportMessage(message)));

    // Project export socket message to action stream
    const projectExportMessage$ = this.getSocketMessage$<ExportProjectPipelineSocketDTO>(
      SocketEvents.DOWNLOAD,
      SocketNamespaces.EXPORT_PROJECT
    ).pipe(map((message) => ExportProjectActions.onExportSocketMessage({ message })));

    // Inference export socket message to action stream
    const inferenceReportMessage$ = this.getSocketMessage$<InferenceReportSocketDTO>(
      SocketEvents.DOWNLOAD,
      SocketNamespaces.EXPORT_INFERENCE_REPORT
    ).pipe(map((message) => ExportInferenceResultStoreActions.onExportInferenceResultReportMessage(message)));

    // Setup remote target socket message to action stream
    const setupTargetMachineMessage$ = this.getSocketMessage$<IConfigureTargetPipeline[]>(
      SocketEvents.SETUP,
      SocketNamespaces.REMOTE_TARGET
    ).pipe(
      map((message) => {
        return PipelineActions.onSetupTargetPipelineSocketMessage({ message });
      })
    );

    // Ping remote target socket message to action stream
    const pingTargetMachineMessage$ = this.getSocketMessage$<IConfigureTargetPipeline[]>(
      SocketEvents.PING,
      SocketNamespaces.REMOTE_TARGET
    ).pipe(
      map((message) => {
        return PipelineActions.onPingTargetPipelineSocketMessage({ message });
      })
    );

    const profilingMessage$ = this.getSocketMessage$<IProfilingPipeline>(
      SocketEvents.PROFILING,
      SocketNamespaces.PROFILING
    ).pipe(
      debounceTime(200),
      map((message) => onProfilingSocketMessage({ message }))
    );

    const inferenceTestImageMessage$ = this.getSocketMessage$<IInferenceTestImagePipeline>(
      SocketEvents.INFERENCE_TEST_IMAGE,
      SocketNamespaces.INFERENCE
    ).pipe(map((message) => InferenceTestImageStoreActions.onImageInferenceSocketMessage({ message })));

    const tokenizerUploadProgress$ = this.getSocketMessage$<ITokenizer>(
      SocketEvents.TOKENIZER,
      SocketNamespaces.UPLOAD
    ).pipe(map((tokenizer) => TokenizerActions.uploadProgress({ tokenizer })));

    const configureMessage$ = this.getSocketMessage$<IConfigurePipeline>(
      SocketEvents.CONFIGURE_MODEL,
      SocketNamespaces.CONFIGURE_MODEL
    ).pipe(
      map((message) => {
        return ModelStoreActions.onConfigureModelSocketMessage({ message });
      })
    );

    return [
      accuracyMessage$,
      deploymentMessage$,
      downloadMessage$,
      projectExportMessage$,
      int8CalibrationMessage$,
      datasetUploadMessage$,
      modelUploadMessage$,
      logDownloadMessage$,
      setupTargetMachineMessage$,
      pingTargetMachineMessage$,
      profilingMessage$,
      inferenceTestImageMessage$,
      projectReportMessage$,
      inferenceReportMessage$,
      tokenizerUploadProgress$,
      configureMessage$,
    ];
  }
}
