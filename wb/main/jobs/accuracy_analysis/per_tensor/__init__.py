"""
 OpenVINO DL Workbench
 Job classes for per tensor distance calculation

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
from wb.main.jobs.accuracy_analysis.per_tensor.per_tensor_report_job import PerTensorReportJob
from wb.main.jobs.accuracy_analysis.per_tensor.create_per_tensor_bundle_job import CreatePerTensorBundleJob
from wb.main.jobs.accuracy_analysis.per_tensor.create_per_tensor_scripts_job import CreatePerTensorScriptsJob
from wb.main.jobs.accuracy_analysis.per_tensor.local_per_tensor_report_job import LocalPerTensorReportJob
from wb.main.jobs.accuracy_analysis.per_tensor.remote_per_tensor_report_job import RemotePerTensorReportJob
