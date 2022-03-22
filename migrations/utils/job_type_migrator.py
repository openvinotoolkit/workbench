"""
 OpenVINO DL Workbench
 Helping Class to migrate job type in database

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
