import os
import sys
import argparse
import time
import requests
import urllib3

DEFAULT_USERNAME = 'workbench_user'

workbench_api_prefix = 'api/v1'

tries_to_check_file_existence = 30
empty_proxies = {
  "http": None,
  "https": None,
}


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--path',
                        nargs='?',
                        type=str)
    parser.add_argument('--token',
                        nargs='?',
                        type=str)
    parser.add_argument('--hostname',
                        nargs='?',
                        type=str)
    parser.add_argument('--tls',
                        nargs='?',
                        default=False,
                        type=int)
    parser.add_argument('--os',
                        nargs='?',
                        default='ubuntu18',
                        type=str)
    return parser.parse_args()


def get_access_token(token_path, hostname, tls):
    url_login = f'{hostname}/{workbench_api_prefix}/auth/login'

    for i in range(0, tries_to_check_file_existence, 1):
        if not os.path.exists(token_path):
            print('Token file is not created at the moment. Retry in 2 seconds')
            time.sleep(2)
        else:
          break

    if not os.path.isfile(token_path):
        raise FileNotFoundError('Token file is not found in path {}'.format(token_path))

    with open(token_path, 'r') as token_file:
        login_token = token_file.read()

    json_data = { 'token': login_token, 'username': DEFAULT_USERNAME }

    if tls:
        response = requests.post(url_login, json=json_data, proxies=empty_proxies, verify=False)
    else:
        response = requests.post(url_login, json=json_data, proxies=empty_proxies)
    response_json = response.json()
    return response_json['accessToken']


def get_artifact_id(hostname, access_token, tls, operating_system: str = 'ubuntu18'):
    url = f'{hostname}/{workbench_api_prefix}/deployment'
    header = {
        'Authorization': 'Bearer {}'.format(access_token)
    }
    json_data = {
        "includeModel": False,
        "pythonBindings": True,
        "targets": ["CPU", "GPU", "VPU"],
        "installScripts": True,
        'targetOS': operating_system
    }
    if tls:
        req = requests.post(url, headers=header, json=json_data, proxies=empty_proxies, verify=False)
    else:
        req = requests.post(url, headers=header, json=json_data, proxies=empty_proxies)
    return req.json()


def get_bundle(artifact_id, hostname, access_token, tls):
    url = f'{hostname}/{workbench_api_prefix}/artifact/{artifact_id}.tar.gz'
    header = {
        'Authorization': 'Bearer {}'.format(access_token)
    }
    if tls:
        req = requests.get(url, headers=header, proxies=empty_proxies, stream=True, verify=False)
    else:
        req = requests.get(url, headers=header, proxies=empty_proxies, stream=True)
    return req


if __name__ == '__main__':
    urllib3.disable_warnings()
    arg = parse_arguments()
    root_path: str = arg.path
    artifactId = None
    status = None
    access_token = get_access_token(arg.token, arg.hostname, arg.tls)
    for i in range(10):
        data: dict = get_artifact_id(arg.hostname, access_token, arg.tls, arg.os)
        print(data)
        artifactId = data.get('artifactId', False)
        status = data.get('status', False)
        if artifactId and status == 'ready':
            break
        time.sleep(30)
    if artifactId and status == 'ready':
        bundle = get_bundle(artifactId, arg.hostname, access_token, arg.tls)
        bundle_path = '{}/bundle.tar.gz'.format(root_path)
        with open(bundle_path, 'wb') as file:
            file.write(bundle.raw.read())
    else:
        sys.exit(1)
    sys.exit(0)
