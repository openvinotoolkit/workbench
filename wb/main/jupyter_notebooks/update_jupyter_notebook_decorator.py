"""
 OpenVINO DL Workbench
 Decorator for updating Jupyter notebook from job

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
from contextlib import closing
from functools import wraps
from typing import Type

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.models import JobsModel, ProjectsModel, JupyterNotebookModel


def update_jupyter_notebook_job(original_class: Type[IJob]):
    def decorate_with_cell_update(func):
        @wraps(func)
        def decorated_function(self: IJob, *args, **kwargs):
            func(self, *args, **kwargs)
            with closing(get_db_session_for_celery()) as session:
                job_model: JobsModel = self.get_job_model(session)
                project: ProjectsModel = job_model.project
                if not project:
                    raise Exception(f'No project found for job {job_model}')
                jupyter_notebook_model: JupyterNotebookModel = project.jupyter_notebook
                if not jupyter_notebook_model or not jupyter_notebook_model.notebook_exists:
                    return
                jupyter_notebook_model.update_cell_by_job_type(job_type=JobTypesEnum(job_model.job_type))

        return decorated_function

    original_class.run = decorate_with_cell_update(original_class.run)
    return original_class
