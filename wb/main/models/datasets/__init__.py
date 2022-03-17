"""
 OpenVINO DL Workbench
 Import Classes for ORM models

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

# in order for database migrations detect models schema changes all models should be imported explicitly

from wb.main.models.datasets.dataset_augmentation_job_model import DatasetAugmentationJobModel
from wb.main.models.datasets.dataset_tasks_model import DatasetTasksModel
from wb.main.models.datasets.datasets_model import DatasetsModel, DatasetJobData, TextDatasetJobData
from wb.main.models.datasets.download_dataset_jobs_model import DownloadDatasetJobsModel