"""
 OpenVINO DL Workbench
 Enumerates classes

 Copyright (c) 2020 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""
import enum
from typing import Tuple, Optional


class JobTypesEnum(enum.Enum):
    profiling_type = 'ProfilingJob'
    single_inference_type = 'SingleInferenceJob'

    int8calibration_type = 'Int8CalibrationJob'

    # Accuracy
    create_accuracy_scripts_type = 'CreateAccuracyScriptsJob'
    create_accuracy_bundle_type = 'CreateAccuracyBundleJob'
    accuracy_type = 'AccuracyJob'
    remote_accuracy_type = 'RemoteAccuracyJob'

    # Per tensor report
    create_per_tensor_scripts_type = 'CreatePerTensorScriptsJob'
    create_per_tensor_bundle_type = 'CreatePerTensorBundleJob'
    per_tensor_report_type = 'PerTensorReportJob'
    remote_per_tensor_report_type = 'RemotePerTensorReportJob'

    # Parent Accuracy Analysis
    create_annotate_dataset_scripts_type = 'CreateAnnotateDatasetScriptsJob'
    create_annotate_dataset_bundle_type = 'CreateAnnotateDatasetBundleJob'
    annotate_dataset = 'AnnotateDatasetJob'
    remote_annotate_dataset = 'RemoteAnnotateDatasetJob'

    extract_dataset_type = 'ExtractDatasetJob'
    extract_text_dataset_type = 'ExtractTextDatasetJob'
    wait_upload_dataset_type = 'WaitDatasetUploadJob'
    recognize_dataset_type = 'RecognizeDatasetJob'
    convert_dataset_type = 'ConvertDatasetJob'
    validate_dataset_type = 'ValidateDatasetJob'
    validate_text_dataset_type = 'ValidateTextDatasetJob'
    generate_dataset_type = 'DatasetGeneratorJob'
    augment_dataset_type = 'DatasetAugmentationJob'

    analyze_model_input_shape_type = 'AnalyzeModelInputShapeJob'
    wait_upload_model_type = 'WaitModelUploadJob'
    model_analyzer_type = 'ModelAnalyzerJob'
    model_optimizer_type = 'ModelOptimizerJob'
    model_optimizer_scan_type = 'ModelOptimizerScanJob'
    convert_keras_type = 'ConvertKerasJob'
    omz_model_download_type = 'OMZModelDownloadJob'
    omz_model_convert_type = 'OMZModelConvertJob'
    omz_model_move_type = 'OMZModelMoveJob'

    download_model_type = 'DownloadModelJob'
    deployment_manager_type = 'DeploymentManagerJob'
    export_project_type = 'ExportProjectJob'

    download_log_type = 'DownloadLogJob'

    export_project_report = 'ProjectReportExportJob'

    export_inference_report = 'InferenceReportExportJob'

    create_profiling_scripts_type = 'CreateProfilingScriptsJob'

    wait_upload_tokenizer_type = 'WaitTokenizerUploadJob'
    validate_tokenizer_type = 'ValidateTokenizerJob'

    # huggingface
    import_huggingface_model_type = 'ImportHuggingfaceModelJob'

    # Remote profiling
    create_profiling_bundle_type = 'CreateProfilingBundleJob'
    remote_profiling_type = 'RemoteProfilingJob'
    remote_int8_calibration_type = 'RemoteInt8CalibrationJob'

    # Remote INT8 calibration
    create_int8_calibration_scripts_type = 'CreateInt8CalibrationScriptsJob'
    create_int8_calibration_bundle_type = 'CreateInt8CalibrationBundleJob'

    create_setup_bundle_type = 'CreateSetupBundleJob'
    upload_artifact_to_target_type = 'UploadArtifactToTargetJob'
    setup_target_type = 'SetupTargetJob'

    get_devices_type = 'GetDevicesJob'
    get_system_resources_type = 'GetSystemResourcesJob'

    # DevCloud
    trigger_dev_cloud_job = 'TriggerDevCloudJob'
    handle_dev_cloud_profiling_sockets_job = 'HandleDevCloudProfilingSocketsJob'
    handle_dev_cloud_int8_calibration_sockets_job = 'HandleDevCloudInt8CalibrationJob'
    handle_dev_cloud_accuracy_sockets_job = 'HandleDevCloudAccuracyJob'
    handle_dev_cloud_dataset_annotation_sockets_job = 'HandleDevCloudDatasetAnnotationJob'
    handle_dev_cloud_per_tensor_sockets_job = 'HandleDevCloudPerTensorJob'
    parse_dev_cloud_profiling_result_job = 'ParseDevCloudProfilingResultJob'
    parse_dev_cloud_int8_calibration_result_job = 'ParseDevCloudInt8CalibrationResultJob'
    parse_dev_cloud_accuracy_result_job = 'ParseDevCloudAccuracyResultJob'
    parse_dev_cloud_dataset_annotation_result_job = 'ParseDevCloudDatasetAnnotationResultJob'
    parse_dev_cloud_per_tensor_result_job = 'ParseDevCloudPerTensorResultJob'

    # Accuracy visualization
    inference_test_image_job = 'InferenceTestImageJob'

    # Environment
    setup_environment_job = 'SetupEnvironmentJob'

    # Reshape Model
    reshape_model = 'ReshapeModelJob'
    create_reshape_model_scripts_job = 'CreateReshapeModelScriptsJob'

    # Apply model layout
    apply_model_layout = 'ApplyModelLayoutJob'

    # Deprecated
    winograd_tune_type = 'WinogradTuneJob'


class StatusEnum(enum.Enum):
    queued = 'queued'
    running = 'running'
    ready = 'ready'
    error = 'error'
    cancelled = 'cancelled'
    archived = 'archived'
    warning = 'warning'


class ModelDomainEnum(enum.Enum):
    CV = 'CV'
    NLP = 'NLP'


class ThroughputUnitNameEnum(enum.Enum):
    FPS = 'FPS'
    SPS = 'SPS'


class TaskMethodEnum(enum.Enum):
    classificator = 'classificator'
    generic = 'generic'
    ssd = 'ssd'
    tiny_yolo_v2 = 'tiny_yolo_v2'
    yolo_v2 = 'yolo_v2'
    yolo_v3 = 'yolo_v3'
    yolo_v4 = 'yolo_v4'
    tiny_yolo_v3_v4 = 'tiny_yolo_v3_v4'
    mask_rcnn = 'mask_rcnn'
    segmentation = 'segmentation'
    inpainting = 'inpainting'
    style_transfer = 'style_transfer'
    super_resolution = 'super_resolution'
    face_recognition = 'face_recognition'
    landmark_detection = 'landmark_detection'
    custom = 'custom'

    @classmethod
    def has_value(cls, value: str) -> bool:
        return any(value == item.value for item in cls)


class AnnotationConverterEnum(enum.Enum):
    common_semantic_segmentation = 'common_semantic_segmentation'
    custom = 'REQUIRED'
    imagenet = 'imagenet'
    inpainting = 'inpainting'
    lfw = 'lfw'
    mscoco_detection = 'mscoco_detection'
    mscoco_mask_rcnn = 'mscoco_mask_rcnn'
    style_transfer = 'style_transfer'
    super_resolution = 'super_resolution'
    super_resolution_dir_based = 'super_resolution_dir_based'
    vgg_face = 'vgg_face'
    voc_detection = 'voc_detection'
    voc_segmentation = 'voc_segmentation'
    wider = 'wider'
    open_images_detection = 'open_images_detection'
    image_processing = 'image_processing'


class YoloAnchorMasksEnum(enum.Enum):
    yolo_v3 = [[6, 7, 8], [3, 4, 5], [0, 1, 2]]
    yolo_v4 = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
    tiny_yolo_v3_v4 = [[3, 4, 5], [1, 2, 3]]


class OptimizationTypesEnum(enum.Enum):
    inference = JobTypesEnum.profiling_type.value
    int8calibration = JobTypesEnum.int8calibration_type.value
    # Deprecated
    winograd_tune = JobTypesEnum.winograd_tune_type.value


class SupportedFrameworksEnum(enum.Enum):
    openvino = 'openvino'
    caffe = 'caffe'
    caffe2 = 'caffe2'
    mxnet = 'mxnet'
    onnx = 'onnx'
    pytorch = 'pytorch'
    tf = 'tf'
    tf2 = 'tf2'
    tf2_keras = 'tf2_keras'

    @classmethod
    def get_name(cls, key: str) -> Optional[str]:
        _frameworks_names = {
            cls.openvino.value: 'OpenVINO IR',
            cls.caffe.value: 'Caffe',
            cls.caffe2.value: 'Caffe2',
            cls.mxnet.value: 'MXNet',
            cls.onnx.value: 'ONNX',
            cls.pytorch.value: 'PyTorch',
            cls.tf.value: 'TensorFlow',
            cls.tf2.value: 'TensorFlow 2.0',
            cls.tf2_keras.value: 'TensorFlow 2.0 Keras',
        }
        return _frameworks_names.get(key)


class TF2FilesKeysEnum(enum.Enum):
    keras = 'kerasModel'
    saved_model_dir = 'savedModelDir'


class ConfigFileNames(enum.Enum):
    tf_pipeline_config = 'pipeline.config'
    transformations_config = 'transformations_config.json'


class ModelPrecisionEnum(enum.Enum):
    fp32 = 'FP32'
    fp16 = 'FP16'
    i8 = 'INT8'
    i1 = 'INT1'
    mixed = 'MIXED'
    unknown = 'UNKNOWN'


class ModelColorChannelsEnum(enum.Enum):
    RGB = 'RGB'
    BGR = 'BGR'
    Grayscale = 'Grayscale'

    @staticmethod
    def values() -> set:
        return set(item.value for item in ModelColorChannelsEnum)


class ArtifactTypesEnum(enum.Enum):
    model = 'model'
    project = 'project'
    project_report = 'project_report'
    inference_report = 'inference_report'
    deployment_package = 'deployment_package'
    bundle_package = 'bundle_package'
    log = 'log'
    job_bundle = 'job_bundle'
    remote_job_result = 'remote_job_result'


class QuantizationAlgorithmEnum(enum.Enum):
    default = 'DefaultQuantization'
    accuracy_aware = 'AccuracyAwareQuantization'


class QuantizationAlgorithmPresetEnum(enum.Enum):
    performance = 'performance'
    mixed = 'mixed'


class ModelSourceEnum(enum.Enum):
    omz = 'omz'
    original = 'original'
    ir = 'ir'
    huggingface = 'huggingface'


class TargetOSEnum(enum.Enum):
    ubuntu18 = 'ubuntu18'
    ubuntu20 = 'ubuntu20'
    windows = 'windows'
    mac = 'mac'


class DeploymentTargetEnum(enum.Enum):
    cpu = 'CPU'
    gpu = 'GPU'
    python37 = 'python3.7'
    python38 = 'python3.8'

    @staticmethod
    def values() -> set:
        return set(item.value for item in DeploymentTargetEnum)

    @staticmethod
    def create(value: str) -> 'DeploymentTargetEnum':
        return DeploymentTargetEnum(value)

    @staticmethod
    def get_python_targets() -> Tuple[str, ...]:
        python_targets = (DeploymentTargetEnum.python37, DeploymentTargetEnum.python38)
        return tuple(python_target.value for python_target in python_targets)


class DeploymentPackageSizesEnum(enum.Enum):
    ie = 24
    cpu = 31.2
    gpu = 16.09
    myriad = 1.8
    hddl = 4.8
    python = 24
    install_script = 0.0032
    gpu_drivers = 0.012
    myriad_drivers = 0.0013

    @staticmethod
    def json():
        return {
            'IE_COMMON': DeploymentPackageSizesEnum.ie.value,
            'TARGETS': {
                'CPU': DeploymentPackageSizesEnum.cpu.value,
                'GPU': DeploymentPackageSizesEnum.gpu.value,
                'MYRIAD': DeploymentPackageSizesEnum.myriad.value,
                'HDDL': DeploymentPackageSizesEnum.hddl.value,
            },
            'DRIVERS': {
                'CPU': 0,
                'GPU': DeploymentPackageSizesEnum.gpu_drivers.value,
                'MYRIAD': DeploymentPackageSizesEnum.myriad_drivers.value,
                'HDDL': 0,
            },
            'PYTHON': DeploymentPackageSizesEnum.python.value,
            'INSTALL_SCRIPT': DeploymentPackageSizesEnum.install_script.value
        }


STATUS_PRIORITY = {
    StatusEnum.queued: 0,
    StatusEnum.ready: 1,
    StatusEnum.running: 2,
    StatusEnum.cancelled: 3,
    StatusEnum.error: 4
}


class DeviceTypeEnum(enum.Enum):
    CPU = 'CPU'
    GPU = 'GPU'
    MYRIAD = 'MYRIAD'
    HDDL = 'HDDL'

    @staticmethod
    def is_supported(device: str) -> bool:
        return device in DeviceTypeEnum.values() or DeviceTypeEnum.is_myriad(device) or DeviceTypeEnum.is_gpu(device)

    @staticmethod
    def values() -> set:
        return set(item.value for item in DeviceTypeEnum)

    @staticmethod
    def is_myriad(device_name: str) -> bool:
        return DeviceTypeEnum.MYRIAD.value in device_name

    @staticmethod
    def is_gpu(device_name: str) -> bool:
        return DeviceTypeEnum.GPU.value in device_name

    @staticmethod
    def is_hddl(device_name: str) -> bool:
        return DeviceTypeEnum.HDDL.value == device_name

    @staticmethod
    def is_vpu(device_name: str) -> bool:
        return DeviceTypeEnum.is_myriad(device_name) or DeviceTypeEnum.is_hddl(device_name)

    @staticmethod
    def get_device(device: str) -> str:
        if DeviceTypeEnum.is_myriad(device):
            return DeviceTypeEnum.MYRIAD.value
        if DeviceTypeEnum.is_gpu(device):
            return DeviceTypeEnum.GPU.value
        return device


class TargetTypeEnum(enum.Enum):
    local = 'local'
    remote = 'remote'
    dev_cloud = 'dev_cloud'


class TargetStatusEnum(enum.Enum):
    available = 'available'
    configuring = 'configuring'
    connecting = 'connecting'
    configuration_failure = 'configuration_failure'
    connection_failure = 'connection_failure'
    not_configured = 'not_configured'
    busy = 'busy'


class PipelineTypeEnum(enum.Enum):
    remote_profiling = 'remote_profiling'
    local_profiling = 'local_profiling'
    dev_cloud_profiling = 'dev_cloud_profiling'
    local_int8_calibration = 'local_int8_calibration'
    remote_int8_calibration = 'remote_int8_calibration'
    dev_cloud_int8_calibration = 'dev_cloud_int8_calibration'
    create_profiling_bundle = 'create_profiling_bundle'
    download_log = 'download_log'
    download_model = 'download_model'
    deployment_manager = 'deployment_manager'
    export_project = 'export_project'
    setup = 'setup'
    ping = 'ping'
    inference_test_image = 'inference_test_image'
    upload_dataset = 'upload_dataset'
    upload_model = 'upload_model'
    upload_tokenizer = 'upload_tokenizer'
    download_omz_model = 'download_omz_model'
    export_project_report = 'export_project_report'
    export_inference_report = 'export_inference_report'

    local_accuracy = 'local_accuracy'
    remote_accuracy = 'remote_accuracy'
    dev_cloud_accuracy = 'dev_cloud_accuracy'

    local_per_tensor_report = 'local_per_tensor_report'
    remote_per_tensor_report = 'remote_per_tensor_report'
    dev_cloud_per_tensor_report = 'dev_cloud_per_tensor_report'

    local_predictions_relative_accuracy_report = 'local_predictions_relative_accuracy_report'
    remote_predictions_relative_accuracy_report = 'remote_predictions_relative_accuracy_report'
    dev_cloud_predictions_relative_accuracy_report = 'dev_cloud_predictions_relative_accuracy_report'

    configure_model = 'configure_model'


class PipelineStageEnum(enum.Enum):
    accuracy = 'accuracy'
    # Setup Pipeline stages
    preparing_setup_assets = 'preparing_setup_assets'
    uploading_setup_assets = 'uploading_setup_assets'
    configuring_environment = 'configuring_environment'
    # Ping Pipeline stages
    collecting_available_devices = 'collecting_available_devices'
    collecting_system_information = 'collecting_system_information'
    # Remote Profile Pipeline stages
    preparing_profiling_assets = 'preparing_profiling_assets'
    preparing_int8_calibration_assets = 'preparing_int8_calibration_assets'
    preparing_accuracy_assets = 'preparing_accuracy_assets'
    profiling = 'profiling'
    getting_remote_job_result = 'getting_remote_job_result'
    # Download Log stage
    download_log = 'download_log'
    # Int8 calibration
    int8_calibration = 'int8_calibration'
    remote_int8_calibration = 'remote_int8_calibration'
    # Dataset
    augment_dataset = 'augment_dataset'
    convert_dataset = 'convert_dataset'
    extract_dataset = 'extract_dataset'
    extract_text_dataset = 'extract_text_dataset'
    recognize_dataset = 'recognize_dataset'
    validate_dataset = 'validate_dataset'
    validate_text_dataset = 'validate_text_dataset'
    wait_dataset_upload = 'wait_dataset_upload'
    # Export Report stages
    export_project_report = 'export_project_report'
    export_inference_report = 'export_inference_report'
    # Tokenizer
    wait_tokenizer_upload = 'wait_tokenizer_upload'
    validate_tokenizer = 'validate_tokenizer'
    # Model
    wait_model_upload = 'wait_model_upload'
    model_analyzer = 'model_analyzer'
    model_optimizer_scan = 'model_optimizer_scan'
    convert_keras_model = 'convert_keras_model'
    convert_model = 'convert_model'
    setup_environment = 'setup_environment'

    # Huggingface
    import_huggingface_model = 'import_huggingface_model',

    # Model Downloader
    download_omz_model = 'download_omz_model'
    convert_omz_model = 'convert_omz_model'
    move_omz_model = 'move_omz_model'

    inference_test_image = 'inference_test_image'
    export_project = 'export_project'

    preparing_reshape_model_assets = 'preparing_reshape_model_assets'
    reshape_model = 'reshape_model'
    apply_model_layout = 'apply_model_layout'


class DevCloudRemoteJobTypeEnum(enum.Enum):
    profiling = 'profiling'
    calibration = 'calibration'
    accuracy = 'accuracy'


class DevCloudAPIVersionEnum(enum.Enum):
    v1 = 'v1'
    v2 = 'v2'


class BenchmarkAppReportTypesEnum(enum.Enum):
    no_counters = 'no_counters'
    average_counters = 'average_counters'


class SocketNamespacesEnum(enum.Enum):
    accuracy = '/accuracy'
    feed = '/feed'
    database = '/database'
    deployment = '/deployment'
    download = '/download'
    profiling = '/profiling'
    inference = '/inference'
    optimization = '/optimization'
    upload = '/upload'
    log = '/log'
    remote_target = '/remote_target'
    create_profiling_bundle = '/create_profiling_bundle'
    create_int8_calibration_bundle = '/create_int8_calibration_bundle'
    export_project_report = '/export_project_report'
    export_inference_report = '/export_inference_report'
    export_project = '/export_project'
    configure_model = '/configure_model'


class SocketEventsEnum(enum.Enum):
    connect = 'connect'
    accuracy = 'accuracy'
    dump = 'dump'
    events = 'events'
    deployment = 'deployment'
    download = 'download'
    profiling = 'profiling'
    int8 = 'int8'
    dataset = 'dataset'
    model = 'model'
    tokenizer = 'tokenizer'
    setup_target = 'setup_target'
    ping_target = 'ping_target'
    create_profiling_bundle = 'create_profiling_bundle'
    create_int8_calibration_bundle = 'create_int8_calibration_bundle'
    inference_test_image = 'inference_test_image'
    configure_model = 'configure_model'


class SSHAuthStatusCodeEnum(enum.Enum):
    SSH_AUTH_ERROR = 7001
    INCORRECT_USERNAME = 7002
    TIMEOUT = 7003
    INCORRECT_HOSTNAME_PORT = 7004
    INCORRECT_KEY = 7005
    INCORRECT_KEY_CONTENT = 7006
    INCORRECT_KEY_NAME = 7007


class SSHAuthStatusMessagesEnum(enum.Enum):
    SSH_AUTH_ERROR = 'ssh_auth_error'
    INCORRECT_USERNAME = 'incorrect_username'
    TIMEOUT = 'timeout'
    INCORRECT_HOSTNAME_PORT = 'incorrect_hostname_port'
    INCORRECT_KEY = 'incorrect_key'
    INCORRECT_KEY_CONTENT = 'incorrect_key_content'
    INCORRECT_KEY_NAME = 'incorrect_key_name'


class RemoteSetupStatusMessagesEnum(enum.Enum):
    NO_PYTHON = 'no_python'
    PYTHON_VERSION_ERROR = 'python_version_error'
    OS_VERSION_ERROR = 'os_version_error'
    NO_INTERNET_CONNECTION = 'no_internet_connection'
    PIP_VERSION_ERROR = 'pip_version_error'
    NO_ROOT_WARNING = 'no_root_warning'
    NO_SUDO_WARNING = 'no_sudo_warning'


class RemoteSetupStatusCodeEnum(enum.Enum):
    PYTHON_VERSION_ERROR = 8001
    OS_VERSION_ERROR = 8002
    NO_INTERNET_CONNECTION = 8003
    PIP_VERSION_ERROR = 8004
    NO_PYTHON = 8005


class ModelAnalyzerErrorMessagesEnum(enum.Enum):
    DEPRECATED_IR_VERSION = 'deprecated_ir_version'


class CPUPlatformTypeEnum(enum.Enum):
    celeron = 'celeron'
    atom = 'atom'
    pentium = 'pentium'
    core = 'core'
    xeon = 'xeon'
    not_recognized = 'not_recognized'

    @classmethod
    def _missing_(cls, unused_value: str) -> 'CPUPlatformTypeEnum':
        return CPUPlatformTypeEnum.not_recognized


class AcceptableFileSizesMb(enum.Enum):
    MODEL = 4500
    DATASET = 10000
    TOKENIZER = 5000
    SSH_KEY = 1


class CeleryTaskSupportedSignal(enum.Enum):
    SIGTERM = 'SIGTERM'
    SIGKILL = 'SIGKILL'
    SIGHUP = 'SIGHUP'


class TestInferVisualizationTypesEnum(enum.Enum):
    explain = 'explain'
    ref_visualization = 'ref_visualization'
    default = 'default'


class AccuracyReportTypeEnum(enum.Enum):
    parent_model_per_tensor = 'parent_model_per_tensor'
    parent_model_predictions = 'parent_model_predictions'
    dataset_annotations = 'dataset_annotations'


class CSVDatasetSeparatorEnum(enum.Enum):
    tab = '\t'
    comma = ','
    semicolon = ';'
    colon = ':'
    pipe = '|'


class ModelShapeTypeEnum(enum.Enum):
    static = 'static'
    dynamic = 'dynamic'


class DatumaroModesEnum(enum.Enum):
    convert = 'convert'
    detect_format = 'detect'


class TokenizerTypeEnum(enum.Enum):
    wordpiece = 'wordpiece'
    BPE = 'BPE'


class OpenVINOWheelsEnum(enum.Enum):
    ov_runtime_wheel = 'ov_runtime_wheel'
    ov_dev_wheel = 'ov_dev_wheel'


class LayoutDimValuesEnum(enum.Enum):
    N = 'N'
    C = 'C'
    H = 'H'
    W = 'W'
    D = 'D'
    S = 'S'
    OTHER = '?'
