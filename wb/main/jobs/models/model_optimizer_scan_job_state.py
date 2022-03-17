"""
 OpenVINO DL Workbench
 Classes for model optimizer scan job state handling

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

from wb.main.jobs.interfaces.job_state import JobStateSubject, JobState
from wb.main.enumerates import StatusEnum
from wb.main.utils.observer_pattern import notify_decorator


class ModelOptimizerScanJobState(JobState):
    """
    Helper class for control Model Optimizer Scan Job state in Job subject and observers
    """

    def __init__(self, log: str = None, status: StatusEnum = None, progress: int = None, error_message: str = None,
                 warning_message: str = None, scan_results: str = None):
        super().__init__(log=log, status=status, progress=progress, error_message=error_message,
                         warning_message=warning_message)
        self.scan_results = scan_results


class ModelOptimizerScanJobStateSubject(JobStateSubject):

    def update_state(self, log: str = None, status: StatusEnum = None,
                     progress: float = None, error_message: str = None,
                     warning_message: str = None):
        if status == StatusEnum.ready:
            progress = 100
        self.subject_state = ModelOptimizerScanJobState(log=log, status=status, progress=progress,
                                                        error_message=error_message,
                                                        warning_message=warning_message)

    @notify_decorator
    def update_model_optimizer_scan_result(self, scan_results: str):
        self.subject_state.scan_results = self.cleanup_results(scan_results)

    @staticmethod
    def cleanup_results(mo_scan_results: str) -> str:
        res = json.loads(mo_scan_results)
        if 'intermediate' in res:
            res['intermediate'] = tuple(res['intermediate'].keys())
        return json.dumps(res)
