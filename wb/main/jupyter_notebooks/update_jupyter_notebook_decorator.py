"""
 OpenVINO DL Workbench
 Decorator for updating Jupyter notebook from job

 Copyright (c) 2021 Intel Corporation

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
