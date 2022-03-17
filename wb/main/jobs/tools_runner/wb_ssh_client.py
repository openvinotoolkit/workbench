"""
 OpenVINO DL Workbench
 Class for handling ssh connection

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
import logging as log
import re

from paramiko import RSAKey, SSHClient, AutoAddPolicy, SSHException
from paramiko.ssh_exception import AuthenticationException

from _socket import gaierror

from config.constants import JOB_FINISH_MARKER
from wb.error.ssh_client_error import SshAuthError, SshAuthUsernameError, SshAuthHostnameError, SshAuthTimeoutError, \
    SshAuthKeyError, SshAuthKeyContentError
from wb.main.console_tool_wrapper.sh_tools.tools import EchoTool
from wb.main.enumerates import SSHAuthStatusMessagesEnum
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class WBSSHClient:
    def __init__(self, host: str, username: str, private_key_path: str = None, port=22):
        self.host = host
        self.port = port
        self.username = username
        self.remove_colors_pattern = re.compile(r'(\x9B|\x1B\[)[0-?]*[ -/]*[@-~]')

        try:
            self.private_key = RSAKey.from_private_key_file(private_key_path)
        except SSHException as exception:
            log.error('Error %s', exception)
            raise SshAuthKeyContentError(SSHAuthStatusMessagesEnum.INCORRECT_KEY_CONTENT.value)
        self.ssh_client = SSHClient()
        self.ssh_client.set_missing_host_key_policy(AutoAddPolicy())
        self.stdin = None
        self.stdout = None
        self.channel = None

    def __enter__(self):
        """
        Open connection
        """
        self.connect_by_pkey()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Close connection
        """
        self.disconnect()
        if exc_val:
            raise

    def connect_by_pkey(self):
        try:
            self.ssh_client.connect(self.host, username=self.username, pkey=self.private_key, port=self.port)
        except AuthenticationException as exception:
            log.error('Error %s', exception)
            raise SshAuthKeyError(SSHAuthStatusMessagesEnum.INCORRECT_KEY.value)
        except SSHException as exception:
            log.error('Error %s', exception)
            raise SshAuthUsernameError(SSHAuthStatusMessagesEnum.INCORRECT_USERNAME.value)
        except gaierror as exception:
            log.error('Error %s', exception)
            raise SshAuthHostnameError(SSHAuthStatusMessagesEnum.INCORRECT_HOSTNAME_PORT.value)
        except TimeoutError as exception:
            log.error('Error %s', exception)
            raise SshAuthTimeoutError(SSHAuthStatusMessagesEnum.TIMEOUT.value)
        except Exception as exception:
            log.error('Error %s', exception)
            raise SshAuthError(SSHAuthStatusMessagesEnum.SSH_AUTH_ERROR.value)
        self._setup_channel()

    def _setup_channel(self):
        self.channel = self.ssh_client.invoke_shell()
        self.stdin = self.channel.makefile('wb')
        self.stdout = self.channel.makefile('r')

    def disconnect(self):
        self.ssh_client.close()

    def execute(self, run_command: str,
                working_directory: str = None,
                environment: dict = None,
                output_processor: ConsoleToolOutputParser = None) -> tuple:
        """
        Run shell command on remote host
        :param run_command: the command to run
        :param working_directory: the directory from which will run script_path
        :param environment: dictionary with environment variables
        :param output_processor: the function to process stdout
        """

        cwd = ''
        if working_directory:
            cwd = 'cd {} &&'.format(working_directory)
        env = ''
        if environment:
            for key, value in environment.items():
                if value is None:
                    continue
                env += '{}={} '.format(key, value)

        command = '{cwd} {env} {command}'.format(cwd=cwd, env=env, command=run_command)
        log.debug('RUN COMMAND: %s', command)
        cmd = command.strip('\n')

        self.stdin.write(cmd + '\n')
        self.stdin.flush()

        get_exit_code_message = 'Command finished with exit status'
        get_exit_code_command = EchoTool(f'{get_exit_code_message} $?').console_command
        self.stdin.write(get_exit_code_command + '\n')
        self.stdin.flush()

        ssh_out = []
        exit_status = 0
        #
        for line in self.stdout:
            str_line = self._line_to_ascii(line)
            if str_line.startswith(cmd) or str_line.startswith(get_exit_code_command):
                # Up for now filled with shell junk from stdin
                ssh_out = []
            elif JOB_FINISH_MARKER in str_line:
                self.stdin.write(get_exit_code_command + '\n')
                self.stdin.flush()
            elif str_line.startswith(get_exit_code_message):
                # Our finish command ends with the exit status
                log.debug(line)
                if output_processor:
                    output_processor.parse(line)
                exit_status = int(str_line.rsplit(maxsplit=1)[1])
                break
            else:
                # Remove from out string hello prefix like user@hostname$
                hello_bash_pattern = r'{}\@\S*\s'.format(self.username)
                clean_line = re.sub(hello_bash_pattern,
                                    '',
                                    line)
                # Remove coloring from string
                clean_line = (self.remove_colors_pattern
                              .sub('', clean_line)
                              .replace('\b', '')
                              .replace('\r', '')
                              )
                # To ASCII
                clean_line = self._line_to_ascii(clean_line)
                ssh_out.append(clean_line)
                log.debug(clean_line)
                if output_processor:
                    output_processor.parse(clean_line)

        # first and last lines of shout/sherr contain a prompt
        if ssh_out and str(get_exit_code_command) in ssh_out[-1]:
            ssh_out.pop()
        if ssh_out and cmd in ssh_out[0]:
            ssh_out.pop(0)
        return exit_status, '\n'.join(ssh_out)

    @staticmethod
    def _line_to_ascii(line: str) -> str:
        return str(line).encode('ascii', 'ignore').decode('ascii')
