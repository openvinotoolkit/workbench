"""
 OpenVINO DL Workbench
 Classes for extract dataset job state handling

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
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_state import JobStateSubject, JobState
from wb.main.utils.observer_pattern import notify_decorator


class DatasetAugmentationJobState(JobState):

    # pylint: disable=too-many-arguments
    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = None, error_message: str = None,
                 warning_message: str = None, dataset_size: float = None, dataset_images: int = None):
        super().__init__(log=log, status=status, progress=progress, error_message=error_message,
                         warning_message=warning_message)
        self.dataset_size = dataset_size
        self.dataset_images = dataset_images


class DatasetAugmentationJobStateSubject(JobStateSubject):

    def update_state(self, log: str = None, status: StatusEnum = None,
                     progress: float = None, error_message: str = None,
                     warning_message: str = None):
        if status == StatusEnum.ready:
            progress = 100
        self.subject_state = DatasetAugmentationJobState(log=log, status=status, progress=progress,
                                                         error_message=error_message,
                                                         warning_message=warning_message)

    @notify_decorator
    def set_images(self, dataset_images: int):
        self.subject_state.dataset_images = dataset_images

    @notify_decorator
    def set_size(self, size: float):
        self.subject_state.dataset_size = size
