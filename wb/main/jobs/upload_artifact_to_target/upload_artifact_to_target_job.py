"""
 OpenVINO DL Workbench
 Class for accuracy job

 Copyright (c) 2018 Intel Corporation

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
import os
from contextlib import closing

from wb.error.job_error import SetupTargetError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.sh_tools.parser import ShParser
from wb.main.console_tool_wrapper.sh_tools.tools import RMTool, MKDirTool
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.jobs.tools_runner.wb_sftp_client import WBSFTPClient
from wb.main.jobs.tools_runner.wb_ssh_client import WBSSHClient
from wb.main.jobs.utils.archive_extractor import ExtractParser, TarGzTool
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.upload_artifact_to_target_job_model import UploadArtifactToTargetJobModel


class UploadArtifactToTargetJob(IJob):
    _job_model_class = UploadArtifactToTargetJobModel
    job_type = JobTypesEnum.upload_artifact_to_target_type

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Uploading artifact to the remote target.')
        session = get_db_session_for_celery()
        with closing(session):
            upload_job = self.get_job_model(session)
            target = session.query(RemoteTargetModel).get(upload_job.target_id)
            artifact = upload_job.artifact

        destination_directory = upload_job.destination_directory

        file_name = os.path.basename(artifact.path)

        wb_ssh_client = WBSSHClient(target.host, target.username, target.private_key_path, target.port)

        wb_sftp_client = WBSFTPClient(wb_ssh_client,
                                      log_callback=lambda message, progress: self._job_state_subject.update_state(
                                          log=message, progress=progress))

        self._job_state_subject.update_state(log='Preparing remote target.')
        self.prepare_path(destination_directory)

        wb_sftp_client.copy_to_target(artifact.path, os.path.join(destination_directory, file_name))

        self.unzip_bundle(file_name, destination_directory)

        self.on_success()

    def unzip_bundle(self, file_name: str, bundle_path: str):
        self._job_state_subject.update_state(log='Extracting setup bundle archive on the remote target.')
        tool = TarGzTool(file_name)
        extract_parser = ExtractParser(job_state_subject=self._job_state_subject)

        with closing(get_db_session_for_celery()) as session:
            upload_job = self.get_job_model(session)
            target_id = upload_job.target_id
            runner = create_runner(target_id, tool, extract_parser, session,
                                   working_directory=bundle_path)

        return_code, _ = runner.run_console_tool(self)
        if return_code:
            raise SetupTargetError('Cannot unzip bundle.', self._job_id)

        tool = RMTool(os.path.join(bundle_path, file_name))
        parser = ShParser(self._job_state_subject)

        with closing(get_db_session_for_celery()) as session:
            runner = create_runner(target_id=target_id,
                                   tool=tool, parser=parser, session=session)

        return_code, _ = runner.run_console_tool(self)
        if return_code:
            raise SetupTargetError('Cannot remove bundle.', self._job_id)

    def prepare_path(self, bundle_path: str):
        parser = ShParser(self._job_state_subject)
        tool = RMTool(bundle_path)
        with closing(get_db_session_for_celery()) as session:
            upload_job = self.get_job_model(session)
            target_id = upload_job.target_id
            runner = create_runner(target_id=target_id,
                                   tool=tool, parser=parser, session=session)
        return_code, _ = runner.run_console_tool(self)
        if return_code:
            raise SetupTargetError('Cannot remove folder {}'.format(bundle_path),
                                   self._job_id)

        tool = MKDirTool(bundle_path)
        with closing(get_db_session_for_celery()) as session:
            runner = create_runner(target_id, tool, parser, session)

        return_code, _ = runner.run_console_tool(self)
        if return_code:
            raise SetupTargetError('Cannot create folder {}'.format(bundle_path),
                                   self._job_id)

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Uploading of the bundle archive successfully finished.')
