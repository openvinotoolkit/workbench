"""
 OpenVINO DL Workbench
 Job classes for per tensor distance calculation

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
from wb.main.jobs.accuracy_analysis.per_tensor.per_tensor_report_job import PerTensorReportJob
from wb.main.jobs.accuracy_analysis.per_tensor.create_per_tensor_bundle_job import CreatePerTensorBundleJob
from wb.main.jobs.accuracy_analysis.per_tensor.create_per_tensor_scripts_job import CreatePerTensorScriptsJob
from wb.main.jobs.accuracy_analysis.per_tensor.local_per_tensor_report_job import LocalPerTensorReportJob
from wb.main.jobs.accuracy_analysis.per_tensor.remote_per_tensor_report_job import RemotePerTensorReportJob
