"""
 OpenVINO DL Workbench
 Class for ORM model described an Int8Calibration Job

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
import json

from sqlalchemy import Column, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship, backref

from wb.error.entry_point_error import InconsistentConfigError
from wb.main.enumerates import JobTypesEnum
from wb.main.enumerates import QuantizationAlgorithmPresetEnum, QuantizationAlgorithmEnum
from wb.main.models import CreateInt8CalibrationScriptsJobModel
from wb.main.models.enumerates import QUANTIZATION_ALGORITHM_ENUM_SCHEMA, QUANTIZATION_ALGORITHM_PRESET_ENUM_SCHEMA
from wb.main.models.jobs_model import JobsModel, JobData


class Int8CalibrationJobData(JobData):
    datasetId: int
    batch: int
    threshold: float
    subsetSize: float
    subsetSize: float
    algorithm: str
    preset: str


class Int8CalibrationJobModel(JobsModel):
    __tablename__ = 'int8_calibration_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.int8calibration_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    algorithm = Column(QUANTIZATION_ALGORITHM_ENUM_SCHEMA, nullable=True)
    preset = Column(QUANTIZATION_ALGORITHM_PRESET_ENUM_SCHEMA, nullable=True)
    threshold = Column(Float, nullable=True)
    subset_size = Column(Integer, nullable=False, default=100)

    result_model_id = Column(Integer, ForeignKey('topologies.id'), nullable=True)
    calibration_dataset_id = Column(Integer, ForeignKey('datasets.id'), nullable=False)

    batch = Column(Integer, nullable=False)
    # TODO Consider removing as not used
    calibration_config = Column(Text, nullable=True)

    dataset = relationship('DatasetsModel',
                           backref=backref('int8_job', lazy='subquery', cascade='delete,all', uselist=False),
                           foreign_keys=[calibration_dataset_id])

    result_model = relationship('TopologiesModel',
                                backref=backref('int8_job', lazy='subquery', cascade='delete,all', uselist=False),
                                foreign_keys=[result_model_id], cascade='delete,all')

    def __init__(self, data: Int8CalibrationJobData):
        super().__init__(data)
        self.batch = data['batch']
        self.threshold = data['threshold']
        self.subset_size = data['subsetSize']
        self.calibration_dataset_id = data['datasetId']
        try:
            self.algorithm = QuantizationAlgorithmEnum(data['algorithm'])
        except KeyError:
            raise InconsistentConfigError('Can not find "algorithm" field in the parameters')
        except ValueError:
            raise InconsistentConfigError(f'{data["algorithm"]} algorithm not supported')

        try:
            self.preset = QuantizationAlgorithmPresetEnum(data['preset'])
        except KeyError:
            raise InconsistentConfigError('Can not find "preset" field in the parameters')
        except ValueError:
            raise InconsistentConfigError(f'{data["preset"]} preset not supported')

    @property
    def int8_config_file_content(self) -> str:
        create_int8_scripts_job_model: CreateInt8CalibrationScriptsJobModel = self.pipeline.get_job_by_type(
            job_type=CreateInt8CalibrationScriptsJobModel.get_polymorphic_job_type())
        int8_config_file_path = create_int8_scripts_job_model.int8_config_file_path
        with open(int8_config_file_path, 'r') as int8_config_file:
            int8_config_file_content = json.load(int8_config_file)
        return json.dumps(int8_config_file_content, indent=4)

    def json(self) -> dict:
        return {
            **super().json(),
            'jobId': self.job_id,
            'type': self.job_type,
            'creationTimestamp': self.creation_timestamp.timestamp(),
            'status': self.status_to_json(),
            'config': self.config_to_json(),
        }

    def config_to_json(self) -> dict:
        return {
            'subsetImages': self.subset_size,
            'algorithm': self.algorithm.value,
            'preset': self.preset.value,
            'threshold': self.threshold,
            'calibrationDatasetId': self.calibration_dataset_id,
        }
