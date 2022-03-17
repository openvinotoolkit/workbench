"""
 OpenVINO DL Workbench
 Classes and functions creating and working with instance of Celery

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
