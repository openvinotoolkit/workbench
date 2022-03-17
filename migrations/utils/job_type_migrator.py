"""
 OpenVINO DL Workbench
 Helping Class to migrate job type in database

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
from sqlalchemy import orm, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class _JobsModel(Base):
    __tablename__ = 'jobs'

    job_type = Column(String(50))
    job_id = Column(Integer, primary_key=True, autoincrement=True)


class JobTypeMigrator:
    def __init__(self,
                 old_job_type: str,
                 new_job_type: str):
        self.old_job_type = old_job_type
        self.new_job_type = new_job_type

    def upgrade(self, session: orm.Session):
        self._migrate(self.old_job_type, self.new_job_type, session)

    def downgrade(self, session: orm.Session):
        self._migrate(self.new_job_type, self.old_job_type, session)

    @staticmethod
    def _migrate(from_job_type: str, to_job_type: str, session: orm.Session):
        jobs = session.query(_JobsModel).filter_by(job_type=from_job_type).all()
        for job in jobs:
            job.job_type = to_job_type
            session.add(job)
        session.flush()
