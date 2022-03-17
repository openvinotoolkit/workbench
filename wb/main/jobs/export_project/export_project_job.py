"""
 OpenVINO DL Workbench
 Class for exporting the whole project

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
import json
import os
import tarfile
import tempfile
from contextlib import closing

import yaml
from sqlalchemy import desc
from sqlalchemy.orm import Session
from openvino.tools.pot.version import get_version as get_pot_version
import openvino.tools.accuracy_checker.__init__ as accuracy_checker_info

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.accuracy_utils import construct_accuracy_tool_config
from wb.main.calibration_abstractions.utils import construct_calibration_tool_config
from wb.main.enumerates import JobTypesEnum, ModelSourceEnum, StatusEnum, AccuracyReportTypeEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import ExportProjectDBObserver
from wb.main.models import (ExportProjectJobModel, JobsModel, SingleInferenceInfoModel, DownloadableArtifactsModel,
                            ProjectsModel, WBInfoModel, AccuracyReportModel)
from wb.main.shared.enumerates import TaskEnum


class ExportProjectJob(IJob):
    job_type = JobTypesEnum.export_project_type
    _job_model_class = ExportProjectJobModel
    extension = '.tar.gz'

    calibration_config_name = 'calibration_config.json'
    accuracy_config_name = 'accuracy_config.yml'

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        export_project_db_observer = ExportProjectDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(export_project_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        session = get_db_session_for_celery()

        with closing(session):
            export_project_model: ExportProjectJobModel = self.get_job_model(session)
            include_model = export_project_model.include_model
            include_dataset = export_project_model.include_dataset
            include_accuracy_config = export_project_model.include_accuracy_config
            include_calibration_config = export_project_model.include_calibration_config

            components_paths = dict()

            project = export_project_model.project

            if include_model:
                components_paths['model'] = project.topology.path
                self._job_state_subject.update_state(status=StatusEnum.running, progress=10)
            with tempfile.TemporaryDirectory() as temp_directory:
                components_paths['description'] = self._generate_description(session, project, temp_directory)

                if include_dataset:
                    components_paths['dataset'] = self._pack_dataset(project.dataset.path,
                                                                     temp_directory,
                                                                     project.dataset.name)
                    self._job_state_subject.update_state(status=StatusEnum.running, progress=20)

                configs_folder = os.path.join(temp_directory, 'configs')
                os.mkdir(configs_folder)
                components_paths['configs'] = configs_folder

                if include_accuracy_config:
                    accuracy_config_path = os.path.join(configs_folder, self.accuracy_config_name)
                    self._generate_accuracy_config(accuracy_config_path, export_project_model)
                    self._job_state_subject.update_state(status=StatusEnum.running, progress=30)
                if include_calibration_config:
                    calibration_config_path = os.path.join(configs_folder, self.calibration_config_name)
                    self._generate_calibration_config(calibration_config_path, project)
                self._job_state_subject.update_state(status=StatusEnum.running, progress=40)

                artifact = export_project_model.downloadable_artifact
                archive_path = DownloadableArtifactsModel.get_archive_path(artifact.id)
                self._pack_project(archive_path, components_paths)
                is_int8 = '_INT8' if project.topology.analysis_job.is_int8 else ''
                package_name = project.topology.name + is_int8 + '_' + project.dataset.name

            artifact.name = package_name
            artifact.update(archive_path)
            artifact.write_record(session)

        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()

    @staticmethod
    def _generate_description(session: Session, project: ProjectsModel, directory: str):
        best_inference_job = session.query(SingleInferenceInfoModel).filter(
            JobsModel.job_type == JobTypesEnum.single_inference_type,
            JobsModel.project_id == project.id,
            JobsModel.progress == 100).order_by(desc(SingleInferenceInfoModel.throughput)).first()

        accuracy_report: AccuracyReportModel = (
            session
                .query(AccuracyReportModel)
                .filter_by(project_id=project.id, report_type=AccuracyReportTypeEnum.dataset_annotations)
                .order_by(AccuracyReportModel.accuracy_result.desc())
                .first()
        )

        workbench_info = session.query(WBInfoModel).first()

        description = {
            'Model': project.topology.name,
            'Dataset': project.dataset.name,
            'Device': ' | '.join((project.device.device_name, project.device.product_name)),
            'Target': ' | '.join((project.target.target_type.value, project.target.host, project.target.name)),
            'Optimized with INT8 Calibration': 'Yes' if project.topology.analysis_job.is_int8 else 'No',
        }

        if best_inference_job:
            description['Corresponding latency'] = best_inference_job.latency
            description['Best result FPS'] = best_inference_job.throughput
            description['Best result batch configuration'] = best_inference_job.batch
            description['Best result stream configuration'] = best_inference_job.nireq

        if accuracy_report:
            description['Accuracy'] = accuracy_report.accuracy_result

        description['DL Workbench version'] = workbench_info.get_version_from_file()
        description['Accuracy Checker version'] = accuracy_checker_info.__version__
        description['Post-training Optimisation Tool version'] = get_pot_version()

        description_path = os.path.join(directory, 'Description.txt')
        with open(description_path, 'w') as description_file:
            for parameter in description:
                new_line = ': '.join((parameter, str(description[parameter])))
                description_file.write(new_line + '\n')

        return description_path

    @staticmethod
    def _generate_accuracy_config(accuracy_config_path: str, export_project_model: ExportProjectJobModel):
        accuracy_config_dict = None

        project = export_project_model.project
        topology = export_project_model.project.topology

        if project.accuracy:
            accuracy_config = project.accuracy.raw_configuration
            accuracy_config_dict = json.loads(accuracy_config)
        elif topology.source == ModelSourceEnum.omz or topology.meta.task_type != TaskEnum.generic:
            accuracy_config = construct_accuracy_tool_config(topology, project.dataset, project.device)
            accuracy_config_dict = accuracy_config.to_dict()

        if accuracy_config_dict:
            with open(accuracy_config_path, 'w') as outfile:
                yaml.dump(accuracy_config_dict, outfile, sort_keys=False)

    @staticmethod
    def _pack_dataset(dataset_path: str, temp_directory: str, dataset_name: str) -> str:
        packed_dataset_folder = os.path.join(temp_directory, 'dataset')
        os.mkdir(packed_dataset_folder)
        dataset_full_name = f'{dataset_name}{ExportProjectJob.extension}'
        packed_dataset_path = os.path.join(packed_dataset_folder, dataset_full_name)

        with tarfile.open(packed_dataset_path, 'w:gz') as tar:
            for file in os.listdir(dataset_path):
                tar.add(os.path.join(dataset_path, file), arcname=file)
        return packed_dataset_folder

    @staticmethod
    def _generate_calibration_config(calibration_config_path: str, project: ProjectsModel):
        if project.topology.int8_job.calibration_config:
            calibration_config = json.loads(project.topology.int8_job.calibration_config)
        else:
            calibration_config = construct_calibration_tool_config(project.topology, project.topology.int8_job).json()
        with open(calibration_config_path, 'w') as out_file:
            json.dump(calibration_config, out_file, indent=3)

    def _pack_project(self, output_filename: str, components_paths: dict):
        with tarfile.open(output_filename, 'w:gz') as tar:
            progress_step = int(50 / len(components_paths))
            progress = 40
            for component in components_paths:
                progress += progress_step

                if component == 'description':
                    tar.add(components_paths[component],
                            arcname=component + os.path.splitext(components_paths[component])[1])
                    continue

                if component == 'model':
                    for file in os.listdir(components_paths[component]):
                        if os.path.splitext(file)[1] in ('.xml', '.bin'):
                            tar.add(os.path.join(components_paths[component], file),
                                    arcname=(os.path.join(component, file)))
                    continue

                for file in os.listdir(components_paths[component]):
                    tar.add(os.path.join(components_paths[component], file), arcname=(os.path.join(component, file)))
                    self._job_state_subject.update_state(status=StatusEnum.running, progress=progress)

    def on_failure(self, exception: Exception):
        with closing(get_db_session_for_celery()) as session:
            export_project_model: ExportProjectJobModel = self.get_job_model(session)
            file_path = DownloadableArtifactsModel.get_archive_path(export_project_model.downloadable_artifact.id)
        if file_path and os.path.isfile(file_path):
            os.remove(file_path)
        super().on_failure(exception)
