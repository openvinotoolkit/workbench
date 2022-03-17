"""model creation to pipeline

Revision ID: 521203454136
Revises: 7f3c818591e1
Create Date: 2021-03-05 18:19:24.989548

"""

"""
 OpenVINO DL Workbench
 Migration: Migrate model creation to pipelines

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import datetime

from alembic import op
from sqlalchemy import Column, Integer, ForeignKey, Text, orm, String, DateTime, Float, ForeignKeyConstraint, \
    PrimaryKeyConstraint
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects import postgresql

from migrations.utils import SQLEnumMigrator

# revision identifiers, used by Alembic.
revision = '521203454136'
down_revision = '5bc9e9b6c3ff'
branch_labels = None
depends_on = None

old_pipeline_types = (
    'accuracy',
    'remote_profiling',
    'local_profiling',
    'dev_cloud_profiling',
    'local_int8_calibration',
    'remote_int8_calibration',
    'dev_cloud_int8_calibration',
    'create_profiling_bundle',
    'download_log',
    'download_model',
    'deployment_manager',
    'setup',
    'ping',
    'inference_test_image',
    'generate_dataset',
    'upload_dataset',
    'export_project_report',
    'export_inference_report',
    'local_winograd_tuning',
    'export_project',
)

new_pipeline_types = (
    *old_pipeline_types,
    'upload_model',
    'download_omz_model'
)

old_pipeline_stages = (
    'accuracy',
    'preparing_setup_assets',
    'uploading_setup_assets',
    'configuring_environment',
    'collecting_available_devices',
    'collecting_system_information',
    'preparing_profiling_assets',
    'preparing_int8_calibration_assets',
    'profiling',
    'getting_remote_job_result',
    'download_log',
    'int8_calibration',
    'remote_int8_calibration',
    'model_analyzer',
    'generate_dataset',
    'wait_dataset_upload',
    'extract_dataset',
    'recognize_dataset',
    'validate_dataset',
    'export_project_report',
    'export_inference_report',
    'inference_test_image',
    'winograd_tuning',
    'export_project'
)

new_pipeline_stages = (
    *old_pipeline_stages,
    'model_optimizer_scan',
    'convert_model',
    'convert_keras_model',
    'wait_model_upload',
    'download_omz_model',
    'convert_omz_model',
    'move_omz_model',
)

pipeline_type_migrator = SQLEnumMigrator(
    table_column_pairs=(('pipelines', 'type'),),
    enum_name='pipelinetypeenum',
    from_types=old_pipeline_types,
    to_types=new_pipeline_types)
pipeline_stage_migrator = SQLEnumMigrator(
    table_column_pairs=(('job_execution_details', 'stage'),),
    enum_name='pipelinestageenum',
    from_types=old_pipeline_stages,
    to_types=new_pipeline_stages)

Base = declarative_base()


class _PipelineModel(Base):
    __tablename__ = 'pipelines'

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)
    id = Column(Integer, primary_key=True)
    target_id = Column(Integer, nullable=False)
    type = Column('type', postgresql.ENUM(*new_pipeline_types,
                                          name='pipelinetypeenum'), autoincrement=False, nullable=False)


class _Artifact(Base):
    __tablename__ = 'artifacts'

    type = Column(String(30))

    __mapper_args__ = {
        'polymorphic_identity': __tablename__,
        'polymorphic_on': type
    }

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False, default='artifact')
    path = Column(String, nullable=True)
    size = Column(Float, nullable=True, default=0.0)
    checksum = Column(String, nullable=True)

    progress = Column(Float, nullable=False, default=0)
    status = Column('status',
                    postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                    name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)

    task_id = Column(String, nullable=True)


class _TopologiesModel(_Artifact):
    __tablename__ = 'topologies'

    __mapper_args__ = {
        'polymorphic_identity': __tablename__
    }

    id = Column(Integer, ForeignKey('artifacts.id'), primary_key=True)
    optimized_from = Column(Integer, ForeignKey('{}.id'.format(__tablename__)), nullable=True)
    converted_from = Column(Integer, ForeignKey('{}.id'.format(__tablename__)), nullable=True)
    downloaded_from = Column(Integer, ForeignKey('omz_topologies.id'), nullable=True)
    precisions = Column(Text, nullable=True)
    framework = Column('framework', postgresql.ENUM('openvino', 'caffe', 'caffe2', 'mxnet', 'onnx', 'tf', 'pytorch',
                                                    'tf2', 'tf2_keras',
                                                    name='supportedframeworksenum'), autoincrement=False, nullable=True)
    source = Column('source', postgresql.ENUM('omz', 'original', 'ir',
                                              name='modelsourceenum'), autoincrement=False, nullable=True)


class _OMZTopologyModel(Base):
    __tablename__ = 'omz_topologies'

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)


class _LocalTargetModel(Base):
    __tablename__ = 'local_targets'

    id = Column(Integer, primary_key=True)


class _JobsModel(Base):
    __tablename__ = 'jobs'

    job_type = Column(String(50))

    __mapper_args__ = {
        'polymorphic_identity': 'job',
        'polymorphic_on': job_type
    }
    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)
    job_id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String, nullable=True)

    project_id = Column(Integer, nullable=True)
    parent_job = Column(Integer, nullable=True, default=None)
    pipeline_id = Column(Integer, nullable=True, default=None)

    progress = Column(Float, nullable=False)

    status = Column('status',
                    postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                    name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)


class _JobExecutionDetailsModel(Base):
    __tablename__ = 'job_execution_details'

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    stage = Column('stage', postgresql.ENUM(*new_pipeline_stages), nullable=True)
    logs = Column(Text, nullable=True)
    progress = Column(Float, nullable=True)
    status = Column('status',
                    postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                    name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)
    warning_message = Column(String, nullable=True)


class _UploadJobsModel(_JobsModel):
    __tablename__ = 'upload_jobs'

    __mapper_args__ = {
        'polymorphic_identity': 'UploaderJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    artifact_id = Column(Integer, ForeignKey('artifacts.id'), nullable=False)


class _OMZModelDownloadJobModel(_JobsModel):
    __tablename__ = 'omz_model_download_jobs'
    __mapper_args__ = {
        'polymorphic_identity': 'ModelDownloaderJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'))
    name = Column(String, nullable=False)
    precision = Column(Text, nullable=False)
    result_model_id = Column(Integer, ForeignKey('topologies.id'), nullable=True)
    path = Column(String, nullable=True)


class _OMZModelConvertJobsModel(_JobsModel):
    __tablename__ = 'omz_model_convert_jobs'
    __mapper_args__ = {
        'polymorphic_identity': 'ModelConvertJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    result_model_id = Column(Integer, ForeignKey('topologies.id'), nullable=True)
    conversion_args = Column(Text, nullable=True)


class _TopologyAnalysisJobsModel(_JobsModel):
    __tablename__ = 'topology_analysis_jobs'
    __mapper_args__ = {
        'polymorphic_identity': 'ModelAnalyzerJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    model_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)


class _OMZModelMoveJobModel(_JobsModel):
    __tablename__ = 'omz_model_move_jobs'
    __mapper_args__ = {
        'polymorphic_identity': 'OMZModelMoveJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    omz_model_id = Column(Integer, ForeignKey('omz_topologies.id'), nullable=False)
    model_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)


class _WaitModelUploadJobsModel(_JobsModel):
    __tablename__ = 'wait_model_upload_jobs'
    __mapper_args__ = {
        'polymorphic_identity': 'WaitModelUploadJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    model_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)


class _ConvertKerasJobsModel(_JobsModel):
    __tablename__ = 'convert_keras_jobs'
    __mapper_args__ = {
        'polymorphic_identity': 'ConvertKerasJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    topology_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)


class _ModelOptimizerScanJobsModel(_JobsModel):
    __tablename__ = 'model_optimizer_scan_jobs'
    __mapper_args__ = {
        'polymorphic_identity': 'ModelOptimizerScanJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    topology_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    information = Column(Text, nullable=True)


class _ModelOptimizerJobModel(_JobsModel):
    __tablename__ = 'model_optimizer'
    __mapper_args__ = {
        'polymorphic_identity': 'ModelOptimizerJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    original_topology_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    result_model_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    mo_args = Column(Text, nullable=True)
    detailed_error_message = Column(Text, nullable=True)


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('wait_model_upload_jobs',
                    Column('job_id', Integer(), nullable=False),
                    Column('model_id', Integer(), nullable=False),
                    ForeignKeyConstraint(['job_id'], ['jobs.job_id'], ),
                    ForeignKeyConstraint(['model_id'], ['topologies.id'], ),
                    PrimaryKeyConstraint('job_id')
                    )

    op.drop_column('convert_keras_to_tf', 'keras_file_path')
    op.drop_column('convert_keras_to_tf', 'output_path')
    op.create_table('omz_model_move_jobs',
                    Column('job_id', Integer(), nullable=False),
                    Column('omz_model_id', Integer(), nullable=False),
                    Column('model_id', Integer(), nullable=False),
                    ForeignKeyConstraint(['job_id'], ['jobs.job_id'], ),
                    ForeignKeyConstraint(['model_id'], ['topologies.id'], ),
                    ForeignKeyConstraint(['omz_model_id'], ['omz_topologies.id'], ),
                    PrimaryKeyConstraint('job_id')
                    )
    # ### end Alembic commands ###
    # Rename model_download to omz_model_download and model_downloader_convert_jobs to omz_model_convert_jobs
    op.rename_table('model_optimizer_analysis', 'model_optimizer_scan_jobs')
    op.rename_table('model_download', 'omz_model_download_jobs')
    op.rename_table('model_downloader_convert_jobs', 'omz_model_convert_jobs')
    op.rename_table('convert_keras_to_tf', 'convert_keras_jobs')
    op.drop_column('omz_model_convert_jobs', 'path')

    pipeline_type_migrator.upgrade()
    pipeline_stage_migrator.upgrade()

    bind = op.get_bind()
    session = orm.Session(bind=bind)

    uploader_jobs = session.query(_UploadJobsModel).all()
    for uploader_job in uploader_jobs:
        child_jobs = session.query(_JobsModel).filter_by(parent_job=uploader_job.job_id).all()
        for child_job in child_jobs:
            child_job.parent_job = None
            session.add(child_job)
            session.flush()
        session.delete(uploader_job)
        session.flush()

    op.drop_table('upload_jobs')

    omz_models = session.query(_TopologiesModel).filter_by(framework='openvino', source='omz').all()
    local_ir_models = session.query(_TopologiesModel).filter_by(framework='openvino', source='ir').all()
    local_original_models = session.query(_TopologiesModel).filter_by(framework='openvino', source='original').all()

    for omz_model in omz_models:
        pipeline = create_pipeline(omz_model, 'download_omz_model', session)
        # Find omz model download job record
        omz_model_download_job = session.query(_OMZModelDownloadJobModel).filter_by(
            result_model_id=omz_model.id).first()
        omz_model_download_job.job_type = 'OMZModelDownloadJob'
        omz_model_download_job.pipeline_id = pipeline.id
        session.add(omz_model_download_job)
        session.flush()
        # Create job details record for omz model download job
        create_job_details(omz_model, omz_model_download_job.job_id, 'download_omz_model', session)
        # Find omz model convert job record
        omz_model_convert_job = session.query(_OMZModelConvertJobsModel).filter_by(
            result_model_id=omz_model.id).first()
        if omz_model_convert_job:
            omz_model_convert_job.job_type = 'OMZModelConvertJob'
            omz_model_convert_job.pipeline_id = pipeline.id
            session.add(omz_model_convert_job)
            session.flush()
            # Create job details record for omz model convert job
            create_job_details(omz_model, omz_model_convert_job.job_id, 'convert_omz_model', session)
        # Create move omz model files job record
        omz_topology_record = session.query(_OMZTopologyModel).get(omz_model.downloaded_from)
        omz_model_move_job = _OMZModelMoveJobModel()
        omz_model_move_job.model_id = omz_model.id
        omz_model_move_job.omz_model_id = omz_topology_record.id
        omz_model_move_job.status = omz_model.status
        omz_model_move_job.error_message = omz_model.error_message
        omz_model_move_job.progress = 100
        omz_model_move_job.job_type = 'OMZModelMoveJob'
        omz_model_move_job.creation_timestamp = omz_model.creation_timestamp
        omz_model_move_job.last_modified = omz_model.last_modified
        omz_model_move_job.pipeline_id = pipeline.id
        session.add(omz_model_move_job)
        session.flush()
        # Create job details record for omz model move job
        create_job_details(omz_model, omz_model_move_job.job_id, 'move_omz_model', session)
        # edit model analysis job and create job details
        create_model_analysis_job_and_details(omz_model, pipeline.id, session)

    for local_ir_model in local_ir_models:
        pipeline = create_pipeline(local_ir_model, 'upload_model', session)
        # create wait model upload job record
        create_wait_model_job_and_details(local_ir_model, pipeline.id, session)
        # edit model analysis job and create job details
        create_model_analysis_job_and_details(local_ir_model, pipeline.id, session)

    for local_original_model in local_original_models:
        pipeline = create_pipeline(local_original_model, 'upload_model', session)
        # create wait model upload job record
        create_wait_model_job_and_details(local_original_model, pipeline.id, session)
        # Find convert keras job record
        converted_model = session.query(_TopologiesModel).get(local_original_model.converted_from)
        if converted_model.framework == 'tf2_keras':
            convert_keras_job = session.query(_ConvertKerasJobsModel).filter_by(
                topology_id=local_original_model.converted_from).first()
            convert_keras_job.job_type = 'ConvertKerasJob'
            convert_keras_job.pipeline_id = pipeline.id
            session.add(convert_keras_job)
            session.flush()
            # Create job details record for convert keras job
            create_job_details(local_original_model, convert_keras_job.job_id, 'convert_keras_model', session)
        # Find model optmizer scan job record
        mo_scan_job = session.query(_ModelOptimizerScanJobsModel).filter_by(
            topology_id=local_original_model.converted_from).first()
        mo_scan_job.job_type = 'ModelOptimizerScanJob'
        mo_scan_job.pipeline_id = pipeline.id
        session.add(mo_scan_job)
        session.flush()
        # Create job details record for model optmizer scan job
        create_job_details(local_original_model, mo_scan_job.job_id, 'model_optimizer_scan', session)
        # Find model optmizer job record
        mo_job = session.query(_ModelOptimizerJobModel).filter_by(
            result_model_id=local_original_model.id).first()
        mo_job.job_type = 'ModelOptimizerJob'
        mo_job.pipeline_id = pipeline.id
        session.add(mo_job)
        session.flush()
        # Create job details record for model optimizer job
        create_job_details(local_original_model, mo_job.job_id, 'convert_model', session)
        # edit model analysis job and create job details
        create_model_analysis_job_and_details(local_original_model, pipeline.id, session)


def create_model_analysis_job_and_details(model: _TopologiesModel, pipeline_id: int, session: Session):
    model_analysis_job = session.query(_TopologyAnalysisJobsModel).filter_by(
        model_id=model.id).first()
    model_analysis_job.job_type = 'ModelAnalyzerJob'
    model_analysis_job.pipeline_id = pipeline_id
    session.add(model_analysis_job)
    session.flush()
    # Create job details record for model analysis job
    create_job_details(model, model_analysis_job.job_id, 'model_analyzer', session)


def create_wait_model_job_and_details(model: _TopologiesModel, pipeline_id: int, session: Session):
    wait_model_upload_job = _WaitModelUploadJobsModel()
    wait_model_upload_job.job_type = 'WaitModelUploadJob'
    wait_model_upload_job.pipeline_id = pipeline_id
    wait_model_upload_job.model_id = model.id
    wait_model_upload_job.status = model.status
    wait_model_upload_job.error_message = model.error_message
    wait_model_upload_job.progress = 100
    wait_model_upload_job.creation_timestamp = model.creation_timestamp
    wait_model_upload_job.last_modified = model.last_modified
    session.add(wait_model_upload_job)
    session.flush()
    create_job_details(model, wait_model_upload_job.job_id, 'wait_model_upload', session)


def create_pipeline(model: _TopologiesModel, type: str, session: Session) -> _PipelineModel:
    pipeline = _PipelineModel()
    local_target = session.query(_LocalTargetModel).one()
    pipeline.target_id = local_target.id
    pipeline.creation_timestamp = model.creation_timestamp
    pipeline.last_modified = model.last_modified
    pipeline.type = type
    session.add(pipeline)
    session.flush()
    return pipeline


def create_job_details(model: _TopologiesModel, job_id: int, stage: str, session: Session):
    job_execution_details = session.query(_JobExecutionDetailsModel).get(job_id)
    if job_execution_details and job_execution_details.stage == stage:
        return
    job_details = _JobExecutionDetailsModel()
    job_details.job_id = job_id
    job_details.status = model.status
    job_details.error_message = model.error_message
    job_details.progress = 100
    job_details.stage = stage
    job_details.creation_timestamp = model.creation_timestamp
    job_details.last_modified = model.last_modified
    session.add(job_details)
    session.flush()


def downgrade():
    raise NotImplementedError('downgrade is not supported')
