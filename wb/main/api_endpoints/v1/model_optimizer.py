"""
 OpenVINO DL Workbench
 Model Optimizer related endpoints

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

import json

from flask import jsonify, request

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.v1 import V1_MODEL_OPTIMIZER_API
from wb.main.api_endpoints.v1.model_downloader import convert_downloaded_model
from wb.main.forms.model_optimizer import MOForm
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.enumerates import StatusEnum
from wb.main.model_optimizer.mo_arg_processor import MOArgProcessor

from wb.main.models import ModelOptimizerJobModel, TopologiesModel
from wb.main.pipeline_creators.model_creation.edit_convert_model_pipeline_creator import EditConvertModelPipelineCreator
from wb.main.utils.safe_runner import safe_run


def convert(mo_job_record: ModelOptimizerJobModel, data: dict):
    """Validate MO params, prepare them, update MO job record and launch MO chain."""

    arg_processor = MOArgProcessor(mo_job_record)
    arg_processor.extract_config_files(data)
    mo_form = MOForm(data, mo_job_record.original_topology.framework.value)

    if mo_form.is_invalid:
        set_status_in_db(ModelOptimizerJobModel, mo_job_record.job_id, StatusEnum.error, get_db_session_for_app())
        set_status_in_db(TopologiesModel, mo_job_record.result_model_id, StatusEnum.error, get_db_session_for_app())
        return jsonify({'errors': mo_form.errors}), 400

    mo_job_record.mo_args = json.dumps(mo_form.get_args())
    mo_job_record.write_record(get_db_session_for_app())

    return jsonify({
        'irId': mo_job_record.result_model_id,
        'modelOptimizerJobId': mo_job_record.job_id,
    })


@V1_MODEL_OPTIMIZER_API.route('/convert', methods=['POST'])
@safe_run
def convert_update():
    """
    Update MO args record and launch MO job.

    Launches conversion with specified params
    for existing IR and MO job record.

    Used as part of original model uploading flow.
    """

    data = request.get_json()

    # pylint: disable=fixme
    # TODO: Extract this condition to separate endpoint
    if data.get('topologyId'):
        return convert_downloaded_model(data)

    mo_job_id = data.pop('modelOptimizerJobId')
    mo_job_record = ModelOptimizerJobModel.query.get(mo_job_id)
    if not mo_job_record:
        return f'Model optimisation record with id {mo_job_id} was not found in the database', 404
    return convert(mo_job_record, data)


@V1_MODEL_OPTIMIZER_API.route('/convert-edit', methods=['POST'])
@safe_run
def convert_edit():
    """Rerun IR conversion with changed MO params."""

    data = request.get_json()
    topology_id = data.pop('irId')

    topology = TopologiesModel.query.get(topology_id)
    if not topology:
        return 'Model with id {} was not found in the database'.format(topology_id), 404

    topology.progress = 0
    topology.status = StatusEnum.queued
    topology.error_message = None

    pipeline_creator = EditConvertModelPipelineCreator(topology.converted_from, topology_id)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()

    return convert(pipeline_creator.model_optimizer_job, data)
