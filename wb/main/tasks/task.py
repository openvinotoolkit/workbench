"""
 OpenVINO DL Workbench
 Class for running Jobs as celery tasks

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
import gc
import logging as log
import os
import signal
import sys
import time
from types import FrameType
from typing import List, Iterable

from celery.app.control import Control
from celery.states import REVOKED
from celery.worker.request import Request
from sqlalchemy.exc import SQLAlchemyError

from wb import get_celery, get_config
from wb.error.code_registry import CodeRegistry
from wb.error.general_error import GeneralError
from wb.error.job_error import ManualTaskRetryException, CancelTaskInChainException
from wb.extensions_factories.database import get_db_for_celery
from wb.main.enumerates import JobTypesEnum, CeleryTaskSupportedSignal
from wb.main.jobs.feed.feed_socket_service import FeedSocketService
from wb.main.jobs.interfaces.ijob import JobFactory
from wb.main.utils.safe_runner import safe_run

CELERY = get_celery()


class Task(CELERY.Task):
    config = get_config()
    job: 'IJob' = None

    # Celery type annotation
    request: Request

    def run(self, previous_task_return_value, job_type: str, job_id: int, **kwargs):
        # The previous_task_return_value argument is required by celery chain method
        # as it uses partial argument rule
        signal.signal(signal.SIGTERM, self.terminate)
        signal.signal(signal.SIGHUP, self.stop_processes)

        self.job = JobFactory.create_job(JobTypesEnum(job_type), job_id, self)
        self.job.set_task_id(self.request.id)
        try:
            return self.job.run()
        except ManualTaskRetryException as exc:
            self.retry(args=[previous_task_return_value, job_type, job_id], kwargs=kwargs,
                       countdown=exc.retry_countdown, max_retries=exc.max_retries)
        except CancelTaskInChainException:
            task_id = self.request.id
            tasks_to_revoke = [task_id]
            log.debug('[ TASK %s CANCELLED ] ', task_id)
            # Cancel next tasks in chain
            next_tasks_chain: List[dict] = self.request.chain
            if next_tasks_chain:
                for task_meta in next_tasks_chain:
                    next_task_id = task_meta['options']['task_id']
                    tasks_to_revoke.append(next_task_id)
            log.debug(tasks_to_revoke)
            cancel_celery_task(tasks=tasks_to_revoke)

    @staticmethod
    def after_return(*unused_args):
        get_db_for_celery().remove()

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        log.debug('[ TASK %s FAILED ] ', task_id)
        log.debug('[ TASK ARGS ] : %s', args)
        log.debug('[ TASK KWARGS ] : %s', kwargs)

        if isinstance(exc, GeneralError):
            message = str(exc)
            error_code = exc.get_error_code()
        elif isinstance(exc, SQLAlchemyError):
            message = 'Unable to update information in database'
            exc = SQLAlchemyError(message)
            error_code = CodeRegistry.get_database_error_code()
        else:
            message = str(exc)
            error_code = 500

        log.error('Server Exception', exc_info=einfo)

        FeedSocketService.emit(error_code, message)

        if self.job:
            safe_run(self.job.on_failure)(exc)
        gc.collect()

    @staticmethod
    def on_success(*unused_args):
        gc.collect()

    def stop_processes(self, unused_signal: int, unused_frame: FrameType):
        self.cancel_task()
        self.after_return()
        sys.exit(1)

    def terminate(self, signal_: int, frame: FrameType):
        self.job.terminate()
        self.stop_processes(signal_, frame)

    def cancel_task(self, *unused_args, **unused_kwargs):
        self.kill_subprocesses_for_job()

        self.request.callbacks = None
        self.request.chain = None
        celery_control: Control = get_celery().control
        celery_control.terminate(task_id=self.request.id, signal=CeleryTaskSupportedSignal.SIGKILL.value)

    def kill_subprocesses_for_job(self):
        if not self.job:
            return
        for pid in self.job.subprocess:
            try:
                os.kill(pid, 0)
            except OSError:
                pass
            else:
                os.kill(pid, signal.SIGKILL)


TASK = CELERY.register_task(Task())


def cancel_celery_task(tasks: List[str], force: bool = False):
    if not tasks:
        return
    signal_to_celery_task = CeleryTaskSupportedSignal.SIGHUP if force else CeleryTaskSupportedSignal.SIGTERM

    celery_control: Control = get_celery().control
    celery_control.terminate(task_id=tasks, signal=signal_to_celery_task.value)


def is_task_revoked(task_id: str) -> bool:
    celery_app = get_celery()
    task_state = celery_app.AsyncResult(task_id).state
    return task_state == REVOKED


def wait_until_tasks_revoked(tasks_ids: Iterable[str], iterations: int = 5, timeout: int = 1) -> bool:
    for _ in range(iterations):
        if all(is_task_revoked(task_id) for task_id in tasks_ids):
            return True
        time.sleep(timeout)
    return False
