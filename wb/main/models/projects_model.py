"""
 OpenVINO DL Workbench
 Class for ORM model described a Project

 Copyright (c) 2018 Intel Corporation

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
from datetime import datetime
from typing import List, Optional, Tuple, TypedDict

from sqlalchemy import Column, Integer, ForeignKey, and_, event
from sqlalchemy.orm import relationship, backref, Session, Mapper, sessionmaker

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.enumerates import OptimizationTypesEnum, StatusEnum, ModelDomainEnum, ThroughputUnitNameEnum
from wb.main.models import PipelineModel, JobsModel, ProfilingJobModel, JupyterNotebookModel
from wb.main.models.single_inference_info_model import SingleInferenceInfoModel
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import OPTIMIZATION_TYPE_ENUM_SCHEMA


class ProjectsModel(BaseModel):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey('topologies.id'), nullable=False)
    dataset_id = Column(Integer, ForeignKey('datasets.id'), nullable=False)

    target_id = Column(Integer, ForeignKey('targets.id'), nullable=True)
    device_id = Column(Integer, ForeignKey('devices.id'), nullable=False)

    project_accuracy_id = Column(Integer, ForeignKey('project_accuracy.id'), nullable=True)

    optimization_type = Column(OPTIMIZATION_TYPE_ENUM_SCHEMA, nullable=False)

    topology = relationship('TopologiesModel', backref=backref('projects', cascade='delete,all'),
                            foreign_keys=[model_id])
    dataset = relationship('DatasetsModel', backref=backref('projects', cascade='delete,all'),
                           foreign_keys=[dataset_id])
    device = relationship('DevicesModel', backref=backref('projects', cascade='delete,all'),
                          foreign_keys=[device_id])
    target: 'TargetModel' = relationship('TargetModel',
                                         backref=backref('projects', cascade='delete,all'),
                                         foreign_keys=[target_id])
    accuracy = relationship('ProjectAccuracyModel', backref=backref('project', cascade='delete,all'),
                            foreign_keys=[project_accuracy_id], uselist=False)

    inferences: [List['SingleInferenceInfoModel']] = relationship('SingleInferenceInfoModel', uselist=True,
                                                                  order_by='SingleInferenceInfoModel.job_id')

    # Relationship backref typing
    jobs: List[JobsModel]
    jupyter_notebook: JupyterNotebookModel
    accuracy_reports: Optional[List['AccuracyReportModel']]

    def __init__(self, model_id: int, dataset_id: int, device_id: int, target_id: int,
                 optimization_type: OptimizationTypesEnum):
        self.model_id = model_id
        self.dataset_id = dataset_id
        self.device_id = device_id
        self.target_id = target_id
        self.optimization_type = optimization_type

    def json(self):
        return {
            'id': self.id,
            'modelId': self.model_id,
            'datasetId': self.dataset_id,
            'deviceId': self.device_id,
            'targetId': self.target_id,
            'targetName': self.target.name,
            'originalModelId': self.get_top_level_model_id(),
            'optimizationType': self.optimization_type.value,
            'optimizationImprovements': self._optimization_improvements,
            'creationTimestamp': self.timestamp_to_milliseconds(self.first_job_creation_timestamp),
            'status': self.status_json,
            'isModelDownloadingAvailable': self._is_model_downloading_available,
            'hasRawAccuracyConfig': bool(self.accuracy),
            'jupyterNotebookPath': self.jupyter_notebook_path
        }

    def get_parent_project(self, session: Session = get_db_session_for_app()) -> Optional['ProjectsModel']:
        parent_project_model_id: int = self.topology.optimized_from
        if not parent_project_model_id:
            return None
        return session.query(ProjectsModel).filter_by(
            model_id=parent_project_model_id,
            dataset_id=self.dataset_id,
            device_id=self.device_id
        ).first()

    @property
    def jupyter_notebook_path(self) -> str:
        return self.jupyter_notebook.notebook_relative_path if \
            self.jupyter_notebook and self.jupyter_notebook.notebook_exists else None

    @property
    def derived_projects(self) -> List['ProjectsModel']:
        result: List[ProjectsModel] = []
        derived_models: List['TopologiesModel'] = self.topology.optimized_to
        if not derived_models:
            return result
        projects_for_derived_models: List[ProjectsModel] = ProjectsModel.query.filter(
            and_(
                ProjectsModel.dataset_id == self.dataset_id,
                ProjectsModel.device_id == self.device_id,
                ProjectsModel.model_id.in_([model.id for model in derived_models]),
            ),
        ).all()
        result.extend(projects_for_derived_models)
        for project in projects_for_derived_models:
            result.extend(project.derived_projects)
        return result

    @property
    def projects_chain_from_top_level(self) -> List['ProjectsModel']:
        top_level_model_id = self.get_top_level_model_id()
        top_level_project: ProjectsModel = ProjectsModel.query.filter(
            and_(
                ProjectsModel.dataset_id == self.dataset_id,
                ProjectsModel.device_id == self.device_id,
                ProjectsModel.model_id == top_level_model_id,
            ),
        ).first()
        result: List[ProjectsModel] = [top_level_project]
        result.extend(top_level_project.derived_projects)
        return result

    @property
    def first_job_creation_timestamp(self) -> datetime:
        if not self.jobs:
            return self.creation_timestamp
        first_job: JobsModel = min(self.jobs, key=lambda job: job.job_id)
        return first_job.creation_timestamp

    def get_jobs_by_type(self, job_type: str) -> List[JobsModel]:
        return list(filter(lambda job: job.job_type == job_type, self.jobs))

    def get_last_job_by_type(self, job_type: str) -> Optional[JobsModel]:
        jobs_by_type = self.get_jobs_by_type(job_type=job_type)
        if not jobs_by_type:
            return None
        return max(jobs_by_type, key=lambda job: job.job_id)

    @property
    def ready_inferences(self) -> List[SingleInferenceInfoModel]:
        inferences: List[SingleInferenceInfoModel] = self.inferences
        if not inferences:
            return []
        return [inference for inference in inferences if inference.status == StatusEnum.ready]

    @property
    def last_pipeline(self) -> Optional[PipelineModel]:
        if not self.jobs:
            return None
        jobs_within_pipelines = [job for job in self.jobs if job.pipeline_id]
        if not jobs_within_pipelines:
            return None
        last_job: JobsModel = max(jobs_within_pipelines, key=lambda job: job.job_id)
        return last_job.pipeline

    @property
    def last_compound_inference_job(self) -> Optional[ProfilingJobModel]:
        return self.get_last_job_by_type(job_type=ProfilingJobModel.get_polymorphic_job_type())

    @property
    def status(self) -> Tuple[StatusEnum, float, Optional[str], Optional[str]]:
        """
        Calculates project status based on the jobs from last pipeline
        or most recent compound inference job

        :return: A tuple of status, progress and error message
        """
        if self._is_archived:
            return StatusEnum.archived, 0, None, None
        last_pipeline = self.last_pipeline
        if last_pipeline:
            return self.last_pipeline.status
        # Local profiling without pipeline approach
        last_compound_inference_job = self.last_compound_inference_job
        if not last_compound_inference_job:
            return StatusEnum.error, 0, 'No associated jobs found for the project', None
        return (last_compound_inference_job.status, last_compound_inference_job.progress,
                last_compound_inference_job.error_message, last_compound_inference_job.execution_details.stage)

    @property
    def _is_archived(self) -> bool:
        return self.dataset.status == StatusEnum.archived or self.topology.status == StatusEnum.archived \
               or not self.device.active

    @property
    def _is_model_downloading_available(self) -> bool:
        if self._is_archived:
            return False
        return self.topology.artifact_exists() and self.topology.status == StatusEnum.ready

    @property
    def status_json(self) -> dict:
        status_name, progress, error_message, stage = self.status
        status_json = {
            'name': status_name.value,
            'progress': progress
        }
        if error_message:
            status_json['errorMessage'] = error_message
            if stage:
                status_json['stage'] = stage.value
        return status_json

    def get_top_level_model_id(self) -> int:
        topology = self.topology
        while topology.optimized_from:
            topology = topology.optimized_from_record
        return topology.id

    @staticmethod
    def find_or_create_project(model_id: int, dataset_id: int, target_id: int, device_id: int,
                               job_type: OptimizationTypesEnum, session: Session) -> int:
        project = ProjectsModel.query.filter_by(model_id=model_id,
                                                dataset_id=dataset_id,
                                                device_id=device_id,
                                                target_id=target_id).first()
        if not project:
            project = ProjectsModel(model_id, dataset_id, device_id, target_id, job_type)
            ProjectsModel.write_record(project, session)
        return project.id

    @property
    def optimization_job(self) -> Optional[JobsModel]:
        topology: 'TopologiesModel' = self.topology
        return topology.int8_job

    @property
    def throughput_unit(self) -> ThroughputUnitNameEnum:
        return ThroughputUnitNameEnum.FPS if self.topology.domain == ModelDomainEnum.CV else ThroughputUnitNameEnum.SPS

    @property
    def _int8_model_size_improvement(self) -> Optional[float]:
        if self.optimization_type != OptimizationTypesEnum.int8calibration:
            return None
        current_session = Session.object_session(self)
        parent_project = self.get_parent_project(session=current_session)
        int8_project_model_size = self.topology.size
        parent_project_model_size = parent_project.topology.size
        if not int8_project_model_size or not parent_project_model_size:
            return None
        return parent_project_model_size / int8_project_model_size

    @property
    def _int8_performance_improvement(self) -> Optional[float]:
        if self.optimization_type != OptimizationTypesEnum.int8calibration:
            return None
        current_session = Session.object_session(self)
        parent_project = self.get_parent_project(session=current_session)
        int8_project_ready_inferences = self.ready_inferences
        parent_project_ready_inferences = parent_project.ready_inferences
        if not int8_project_ready_inferences or not parent_project_ready_inferences:
            return None

        def _get_baseline_profiling_throughput(inferences: List[SingleInferenceInfoModel]) -> Optional[float]:
            baseline_profiling = next(filter(lambda result: result.batch == 1 and result.nireq == 1, inferences), None)
            return baseline_profiling.throughput if baseline_profiling else None

        int8_project_throughput = _get_baseline_profiling_throughput(int8_project_ready_inferences)
        parent_project_throughput = _get_baseline_profiling_throughput(parent_project_ready_inferences)
        if not int8_project_throughput or not parent_project_throughput:
            return None
        return int8_project_throughput / parent_project_throughput

    @property
    def _optimization_improvements(self) -> TypedDict('ProjectOptimizationImprovements',
                                                      {'modelSize': Optional[float], 'performance': Optional[float]}):
        return {
            'modelSize': self._int8_model_size_improvement,
            'performance': self._int8_performance_improvement,
        }


@event.listens_for(ProjectsModel, 'after_insert', propagate=True)
def create_jupyter_notebook_for_new_project(_: Mapper, connection, project: ProjectsModel):
    session_maker = sessionmaker(bind=connection, autocommit=False)
    session = session_maker()
    jupyter_notebook_model = JupyterNotebookModel(project_id=project.id)
    session.add(jupyter_notebook_model)
    session.commit()
    session.close()
