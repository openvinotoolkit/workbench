import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';

import { TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';

enum PipelineSpecificNames {
  WARNING = 'warning',
}

export enum PipelineStageStatusNames {
  QUEUED = ProjectStatusNames.QUEUED,
  IN_PROGRESS = ProjectStatusNames.RUNNING,
  SUCCESS = ProjectStatusNames.READY,
  FAILURE = ProjectStatusNames.ERROR,
  WARNING = PipelineSpecificNames.WARNING,
}

export type PipelineStageStatusNamesType = typeof PipelineStageStatusNames[keyof typeof PipelineStageStatusNames];

export interface ConfigureTargetPipelineStage {
  jobId: number;
  status: PipelineStageStatusNamesType;
  stage: ConfigureTargetPipelineStagesEnum;
  logs: string;
  errorMessage: string | null;
  warningMessage: string | null;
}

export enum ConfigureTargetPipelineType {
  SETUP = 'setup',
  PING = 'ping',
}

type PipelineStatus = Omit<ProjectStatus, 'name'> & {
  name: PipelineStageStatusNamesType;
};

export interface IConfigureTargetPipeline {
  id: number;
  targetId: number;
  targetStatus: TargetMachineStatusNames;
  type: ConfigureTargetPipelineType;
  stages: ConfigureTargetPipelineStage[];
  status: PipelineStatus;
}

export enum SetupTargetPipelineStagesEnum {
  PREPARING_SETUP_ASSETS = 'preparing_setup_assets',
  UPLOADING_SETUP_ASSETS = 'uploading_setup_assets',
  CONFIGURING_ENVIRONMENT = 'configuring_environment',
}

export interface SetupTargetPipeline extends IConfigureTargetPipeline {
  type: ConfigureTargetPipelineType.SETUP;
  stages: SetupTargetPipelineStage[];
}

export interface SetupTargetPipelineStage extends ConfigureTargetPipelineStage {
  stages: ConfigureTargetPipelineStage[];
}

export enum PingTargetPipelineStagesEnum {
  COLLECTING_AVAILABLE_DEVICES = 'collecting_available_devices',
  COLLECTING_SYSTEM_INFORMATION = 'collecting_system_information',
}

export interface PingTargetPipeline extends IConfigureTargetPipeline {
  type: ConfigureTargetPipelineType.PING;
  stages: PingTargetPipelineStage[];
}

export interface PingTargetPipelineStage extends ConfigureTargetPipelineStage {
  stages: SetupTargetPipelineStagesEnum[];
}

export type ConfigureTargetPipelineStagesEnum = SetupTargetPipelineStagesEnum | PingTargetPipelineStagesEnum;

export const pipelineStageNameMap: { [key in ConfigureTargetPipelineStagesEnum]: string } = {
  [SetupTargetPipelineStagesEnum.PREPARING_SETUP_ASSETS]: 'Preparing Setup Assets',
  [SetupTargetPipelineStagesEnum.UPLOADING_SETUP_ASSETS]: 'Uploading Setup Assets',
  [SetupTargetPipelineStagesEnum.CONFIGURING_ENVIRONMENT]: 'Configuring Environment',
  [PingTargetPipelineStagesEnum.COLLECTING_AVAILABLE_DEVICES]: 'Collecting Available Devices',
  [PingTargetPipelineStagesEnum.COLLECTING_SYSTEM_INFORMATION]: 'Collecting System Information',
};

export enum AuthStageErrorsEnum {
  SSH_AUTH_ERROR = 'ssh_auth_error',
  INCORRECT_USERNAME = 'incorrect_username',
  TIMEOUT = 'timeout',
  INCORRECT_HOSTNAME_PORT = 'incorrect_hostname_port',
  INCORRECT_KEY = 'incorrect_key',
  INCORRECT_KEY_CONTENT = 'incorrect_key_content',
}

export enum RemoteSetupStageErrorsEnum {
  NO_PYTHON = 'no_python',
  PYTHON_VERSION_ERROR = 'python_version_error',
  OS_VERSION_ERROR = 'os_version_error',
  NO_INTERNET_CONNECTION = 'no_internet_connection',
  PIP_VERSION_ERROR = 'pip_version_error',
}

export type ConfigureStageErrorsEnum = AuthStageErrorsEnum | RemoteSetupStageErrorsEnum;

export const pipelineStageErrorNameMap: { [key in ConfigureStageErrorsEnum]: string } = {
  [AuthStageErrorsEnum.SSH_AUTH_ERROR]: 'Authentication Error',
  [AuthStageErrorsEnum.INCORRECT_USERNAME]: 'Incorrect Username',
  [AuthStageErrorsEnum.TIMEOUT]: 'Timeout',
  [AuthStageErrorsEnum.INCORRECT_HOSTNAME_PORT]: 'Incorrect Hostname or Port',
  [AuthStageErrorsEnum.INCORRECT_KEY]: 'Incorrect SSH Key',
  [AuthStageErrorsEnum.INCORRECT_KEY_CONTENT]: 'Incorrect SSH Key Content',
  [RemoteSetupStageErrorsEnum.NO_PYTHON]: 'Python is not installed on the machine',
  [RemoteSetupStageErrorsEnum.PYTHON_VERSION_ERROR]: 'Unsupported Python Version',
  [RemoteSetupStageErrorsEnum.OS_VERSION_ERROR]: 'Unsupported OS Version',
  [RemoteSetupStageErrorsEnum.NO_INTERNET_CONNECTION]: 'No Internet Connection',
  [RemoteSetupStageErrorsEnum.PIP_VERSION_ERROR]: 'Unsupported pip version',
};

export enum RemoteSetupStageWarningsEnum {
  NO_SUDO_WARNING = 'no_sudo_warning',
}

export const pipelineStageWarningsNameMap: { [key in RemoteSetupStageWarningsEnum]: string } = {
  [RemoteSetupStageWarningsEnum.NO_SUDO_WARNING]: 'No sudo package',
};
