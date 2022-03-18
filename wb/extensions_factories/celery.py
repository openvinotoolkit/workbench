"""
 OpenVINO DL Workbench
 Classes and functions creating and working with instance of Celery

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
from celery import Celery

from wb.config.application import get_config


def get_celery() -> Celery:
    return get_celery.CELERY


get_celery.CELERY = Celery(backend=get_config().celery_backend_url,
                           broker=get_config().broker_url)


def init_celery_app(app):
    celery = get_celery()
    celery.conf.update(app.config)

    return celery
