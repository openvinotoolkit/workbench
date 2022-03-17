"""
 OpenVINO DL Workbench
 Class for parsing DevCloud profiling result job

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import logging as log
import os
import re
import tarfile
import tempfile
from contextlib import closing
from typing import Tuple

from config.constants import BENCHMARK_REPORT_FILE_NAME, EXEC_GRAPH_FILE_NAME
from wb.error.job_error import ManualTaskRetryException, ProfilingError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.models import (ProfilingJobModel, DownloadableArtifactsModel, FilesModel,
                            ParseDevCloudProfilingResultJobModel, ParseDevCloudResultJobModel, SingleInferenceInfoModel)
from wb.main.utils.profiling_run_info import SingleProfilingRunInfo
from wb.main.utils.utils import find_by_ext
from wb.utils.benchmark_report.benchmark_report import BenchmarkReport


class ParseDevCloudProfilingResultJob(IJob):
    job_type = JobTypesEnum.parse_dev_cloud_profiling_result_job
    _job_model_class = ParseDevCloudResultJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running,
                                             log='Starting parse DevCloud profiling result job')
        with closing(get_db_session_for_celery()) as session:
            parse_profiling_result_job_model: ParseDevCloudProfilingResultJobModel = self.get_job_model(session)
            profiling_result_artifact: DownloadableArtifactsModel = parse_profiling_result_job_model.result_artifact
            compound_inference_job_id = parse_profiling_result_job_model.parent_job

            # Wait for file to be completely uploaded by chunks
            if not profiling_result_artifact.is_all_files_uploaded:
                raise ManualTaskRetryException('Profiling result artifact is not uploaded yet, retry task')

            log.debug('Parsing profiling result artifact and saving data to database')
            profiling_result_file_record: FilesModel = profiling_result_artifact.files[0]
            profiling_result_file_path = profiling_result_file_record.path

        if not os.path.isfile(profiling_result_file_path):
            raise FileNotFoundError(f'Result artifact is not found in path {profiling_result_file_path}')

        with tempfile.TemporaryDirectory('rw') as tmp_folder:
            with tarfile.open(profiling_result_file_path, 'r:gz') as tar:
                tar.extractall(path=tmp_folder)

            (_, result_dir_names, _) = next(os.walk(tmp_folder))

            for benchmark_app_result_dir_name in result_dir_names:
                self._parse_profiling_result_files(extracted_files_path=tmp_folder,
                                                   benchmark_app_result_dir_name=benchmark_app_result_dir_name,
                                                   compound_inference_job_id=compound_inference_job_id)

        self.on_success()

    def _parse_profiling_result_files(self, extracted_files_path: str, benchmark_app_result_dir_name: str,
                                      compound_inference_job_id: int):
        benchmark_app_result_dir_path = os.path.join(extracted_files_path, benchmark_app_result_dir_name)
        exec_graph_path = os.path.join(benchmark_app_result_dir_path, EXEC_GRAPH_FILE_NAME)
        benchmark_report_path = os.path.join(benchmark_app_result_dir_path, BENCHMARK_REPORT_FILE_NAME)

        batch, nireq = self._parse_batch_and_num_streams(benchmark_app_result_dir_name)

        session = get_db_session_for_celery()
        with closing(session):
            profiling_job: ProfilingJobModel = session.query(ProfilingJobModel).get(
                compound_inference_job_id)
            model_record = profiling_job.project.topology
            model_path = find_by_ext(model_record.path, 'xml')

            profiling_run_info = self._parse_profiling_run_info(batch=batch, nireq=nireq, model_path=model_path,
                                                                exec_graph_path=exec_graph_path,
                                                                benchmark_report_path=benchmark_report_path)

            profiling_info_model = (
                SingleInferenceInfoModel
                    .get_or_create_single_inference_model(batch=batch, nireq=nireq,
                                                          project_id=profiling_job.project_id,
                                                          profiling_job_id=compound_inference_job_id,
                                                          session=session)
            )

            profiling_info_model.update(profiling_results=profiling_run_info)
            profiling_info_model.progress = 100
            profiling_info_model.status = StatusEnum.ready
            profiling_info_model.write_record(session)

    @staticmethod
    def _parse_batch_and_num_streams(benchmark_app_result_dir_name: str) -> Tuple[int, int]:
        dir_name_pattern = r'^\d+_\d+$'
        if not re.match(dir_name_pattern, benchmark_app_result_dir_name):
            raise ValueError(f'Benchmark app result directory name {benchmark_app_result_dir_name} is not valid')
        batch, nireq = str(benchmark_app_result_dir_name).split('_', maxsplit=1)
        return int(batch), int(nireq)

    def _parse_profiling_run_info(self, batch: int, nireq: int, model_path: str, exec_graph_path: str,
                                  benchmark_report_path: str) -> SingleProfilingRunInfo:
        profiling_run_info = SingleProfilingRunInfo(batch, nireq, model_path)
        with open(exec_graph_path) as exec_graph_file:
            execution_graph = exec_graph_file.read()
        profiling_run_info.exec_graph = execution_graph

        try:
            benchmark_report = BenchmarkReport(path=benchmark_report_path)
        except ValueError:
            raise ProfilingError('Inconsistent benchmark app report', self.job_id)
        profiling_run_info.fill_from_report(benchmark_report)
        return profiling_run_info

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             progress=100,
                                             log='Parse DevCloud profiling result job successfully finished')
        self._job_state_subject.detach_all_observers()
