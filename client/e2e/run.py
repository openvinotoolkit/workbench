import os
import sys
import argparse
import shlex
import json
import re

from string import Template


root_folder = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
BROWSERS = ['chrome', 'firefox']


def load_commands() -> dict:
    path_to_file = os.path.join(root_folder, 'e2e', 'commands.json')
    with open(path_to_file) as json_file:
        return json.load(json_file)


def parse_arguments(params: list) -> dict:
    param_str = " ".join(params)
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', type=str)
    parser.add_argument('--browsers', type=str)
    parser.add_argument('--generate-nightly', action='store_true')
    parser.add_argument('--suites', type=str)
    args = parser.parse_args(shlex.split(param_str))
    params_dict = dict()
    params_dict['mode'] = args.mode
    params_dict['browsers'] = args.browsers
    params_dict['generate_nightly'] = args.generate_nightly
    params_dict['suites'] = args.suites
    return params_dict


def generate_execute_string(params: dict, commands: dict, path: str):
    base_commands: list = [get_generate_nightly_string(params['generate_nightly'], commands),
                           get_pre_string(params['browsers'], commands['browsers'], params['mode']),
                           get_mode_string(params['mode'], commands['mode'], params['suites'], commands['suites'])]
    base_commands = list(filter(None, base_commands))
    result = ' && '.join(base_commands)
    result = result.replace('./', '{}/'.format(path))
    return result


def get_generate_nightly_string(param: dict, commands: dict):
    result = ''
    if param:
        result = commands['generate_nightly']
    return result


def get_mode_string(mode: str, commands_mode: dict, suites_params: str, commands_suites: dict):
    result: str = ''
    suites_commands = get_suite_string(suites_params, commands_suites)
    if mode:
        result = commands_mode['base']
        if mode == 'local':
            current_mode = commands_mode['local']
        else:
            current_mode = commands_mode['ci']
        result = result.format(mode=current_mode, suites=suites_commands)
    return result


def get_pre_string(params: dict, commands: dict, mode: str = 'ci'):
    result: list = []
    if mode == 'ci' and 'firefox' in params:
        return ''
    elif params:
        browsers_commands: dict = {}
        parameters_browsers = params
        for browser in BROWSERS:
            if browser in parameters_browsers:
                browsers_commands[browser] = commands[browser]
            else:
                browsers_commands[browser] = commands['without:{}'.format(browser)]
        browser_str: str = commands['base']
        result.append(browser_str.format(firefox=browsers_commands['firefox'], chrome=browsers_commands['chrome']))

        if parameters_browsers.replace(" ", "") == 'firefox':
            result.append(commands['single:firefox'])
    return ' && '.join(result)


def get_suite_string(suites_str: str, commands: dict):
    result = ''
    if suites_str:
        suites = suites_str.replace(" ", "").split(',')
        suites_commands: list = []
        for suite in suites:
            suites_commands.append(commands[suite])
        suites_str: str = commands['base']
        result = suites_str.format(suites=','.join(suites_commands))
    return result


if __name__ == '__main__':
    cli_params: dict = parse_arguments(sys.argv[1:])
    cli_commands: dict = load_commands()
    execute_str = generate_execute_string(cli_params, cli_commands, root_folder)
    os.system(execute_str)
