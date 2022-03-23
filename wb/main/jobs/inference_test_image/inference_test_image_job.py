"""
 OpenVINO DL Workbench
 Infer test image job

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
import json
from contextlib import closing

from openvino.tools.accuracy_checker.evaluators import ModelEvaluator

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.accuracy_utils import construct_visualization_config
from wb.main.enumerates import JobTypesEnum, StatusEnum, TestInferVisualizationTypesEnum
from wb.main.jobs.inference_test_image.inference_test_image_job_state import (InferenceTestImageJobStateSubject,
                                                                              InferenceTestImageDBObserver)
from wb.main.jobs.inference_test_image.test_image_evaluator import TestImageEvaluator
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.models import TopologiesModel, TopologyAnalysisJobsModel, DevicesModel, InferenceTestImageJobModel
from wb.main.shared.enumerates import TaskEnum


class InferenceTestImageJob(IJob):
    job_type = JobTypesEnum.inference_test_image_job
    _job_model_class = InferenceTestImageJobModel

    # Annotations:
    _job_state_subject: InferenceTestImageJobStateSubject

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._job_state_subject: InferenceTestImageJobStateSubject = InferenceTestImageJobStateSubject(self._job_id)

        inference_job_db_observer = InferenceTestImageDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(inference_job_db_observer)
        self._attach_default_db_and_socket_observers()

    # pylint: disable=too-many-locals
    def run(self):
        self._job_state_subject.update(progress=0, status=StatusEnum.running)
        session = get_db_session_for_celery()
        with closing(session):
            job: InferenceTestImageJobModel = session.query(InferenceTestImageJobModel).get(self._job_id)
            topology: TopologiesModel = job.topology
            parent_topology: TopologiesModel = topology.optimized_from_record
            device: DevicesModel = job.device
            test_image_path = job.test_image.image_path
            analysis_job: TopologyAnalysisJobsModel = topology.analysis_job

            visualization_config = construct_visualization_config(topology, device).to_dict()
            task_type: TaskEnum = TaskEnum(topology.meta.visualization_configuration_json().get('taskType'))

        model_evaluator = ModelEvaluator.from_configs(
            visualization_config['models'][0], delayed_annotation_loading=True
        )

        inputs_len = len(json.loads(analysis_job.inputs)) if analysis_job.inputs else 1
        evaluator = TestImageEvaluator(model_evaluator, task_type, inputs_len)

        try:
            # only classification task supported
            if job.visualization_type == TestInferVisualizationTypesEnum.explain:
                predictions = evaluator.explain(
                    test_image_path,
                    progress_cb=lambda progress: self._job_state_subject.update(
                        progress=float(progress), status=StatusEnum.running
                    ),
                )
            else:
                predictions = evaluator.evaluate(test_image_path, job.test_image.mask_path)
        finally:
            model_evaluator.release()

        serialized_predictions = json.dumps(predictions, default=lambda o: o.__dict__)
        serialized_ref_predictions = None

        if job.visualization_type == TestInferVisualizationTypesEnum.ref_visualization:
            ref_model_visualization_config = construct_visualization_config(parent_topology, device).to_dict()
            ref_model_evaluator = ModelEvaluator.from_configs(
                ref_model_visualization_config['models'][0], delayed_annotation_loading=True
            )

            ref_evaluator = TestImageEvaluator(ref_model_evaluator, task_type, inputs_len)
            ref_predictions = ref_evaluator.evaluate(test_image_path, job.test_image.mask_path)
            ref_model_evaluator.release()
            serialized_ref_predictions = json.dumps(ref_predictions, default=lambda o: o.__dict__)

        self._job_state_subject.update(progress=100, status=StatusEnum.ready, predictions=serialized_predictions,
                                       ref_predictions=serialized_ref_predictions)
        self._job_state_subject.detach_all_observers()

        with closing(session):
            job.test_image.delete_record(session)

    def on_failure(self, exception: Exception):
        message = str(exception)

        self._job_state_subject.update(progress=0, status=StatusEnum.error, error_message=message)
        self._job_state_subject.detach_all_observers()

        with closing(get_db_session_for_celery()) as session:
            job: InferenceTestImageJobModel = self.get_job_model(session)
            job.test_image.delete_record(session)

    def terminate(self):
        self._job_state_subject.update(progress=0, status=StatusEnum.cancelled)
        self._job_state_subject.detach_all_observers()

        with closing(get_db_session_for_celery()) as session:
            job: InferenceTestImageJobModel = self.get_job_model(session)
            job.test_image.delete_record(session)
