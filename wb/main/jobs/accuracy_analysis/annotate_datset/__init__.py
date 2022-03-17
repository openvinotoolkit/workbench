"""
 OpenVINO DL Workbench
 Job classes for dataset annotation

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
from wb.main.jobs.accuracy_analysis.annotate_datset.create_annotate_dataset_bundle_job import \
    CreateAnnotateDatasetBundleJob
from wb.main.jobs.accuracy_analysis.annotate_datset.create_annotate_dataset_scripts_job import \
    CreateAnnotateDatasetScriptsJob
from wb.main.jobs.accuracy_analysis.annotate_datset.local_annotate_dataset_job import LocalAnnotateDatasetJob
from wb.main.jobs.accuracy_analysis.annotate_datset.remote_annotate_dataset_job import RemoteAnnotateDatasetJob
