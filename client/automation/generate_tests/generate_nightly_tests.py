import json
import os
import textwrap
import argparse
import time
import copy
import enum

import requests
import urllib3

from wb.utils.get_env_var import get_env_var
from config.constants import DEFAULT_USERNAME, USER_TOKEN_DEFAULT_DIR, TOKEN_FILENAME


class QuantizationAlgorithmEnum(enum.Enum):
    default = 'DefaultQuantization'
    accuracy_aware = 'AccuracyAwareQuantization'


WORKBENCH_API_PREFIX = 'api/v1'

algorithms = [QuantizationAlgorithmEnum.default, QuantizationAlgorithmEnum.accuracy_aware]
default_timeout = 1800000
frameworks = ['caffe', 'caffe2', 'mxnet', 'openvino', 'pytorch', 'tf']
empty_proxies = {
  "http": None,
  "https": None,
}
current_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
root_folder = os.path.dirname(current_dir)

tries_to_check_file_existence = 30


def update_spec(name, precision, algorithm, updates_array):
    skip = 'it'
    for key, value in updates_array.items():
        if key == name:
            if 'skip' in value:
                skip = 'xit'
            if 'disable_precision' in value and precision in value['disable_precision'].split(','):
                skip = 'xit'
            if 'disable_presets' in value and algorithm in value['disable_presets']:
                skip = 'xit'
    return skip


def get_timeout_models(models):
    return {key: value for key, value in models.items() if is_need_modify(value)}


def get_layouts(name, models):
    for key, value in models.items():
        if key == name and value.get('layouts'):
            return value['layouts']
    return []


def is_need_modify(value: dict) -> bool:
    return bool({'timeout', 'subSet', 'accuracyDrop'}.intersection(value.keys()))


def write_header(path_test, models):
    timeout_models = get_timeout_models(models)
    with open(path_test, 'w') as file:
        file.write(textwrap.dedent('''\
                    import {{ browser }} from 'protractor';

                    import {{ OptimizationAlgorithm }} from '@store/project-store/project.model';

                    import {{ Frameworks, TestUtils }} from './pages/test-utils';
                    import {{ LoginPage }} from './pages/login.po';
                    import {{ InferenceUtils }} from './pages/inference-utils';
                    import {{ InferenceType, OptimizationType }} from './pages/configuration-wizard.po';
                    import {{ Helpers }} from './pages/helpers';
                    import {{ CalibrationUtils }} from './pages/calibration-utils';

                    describe('[Nightly] UI tests on Running inference, accuracy, int8 tuning on OMZ models', () => {{
                      const timeoutModels = {timeout_models};
                      const updateModelsList = Object.keys(timeoutModels);
                      const datasetFileVOC = browser.params.precommit_scope.resources.smallVOCDataset;
                      const datasetFileImageNet = browser.params.precommit_scope.resources.smallImageNetDataset;
                      const dataSetFileCoco = browser.params.precommit_scope.resources.cocoDataset;
                      const dataSetFileSemantic = browser.params.precommit_scope.resources.smallSemanticSegmentationDataset;
                      const dataSetFileLFW = browser.params.precommit_scope.resources.LFWDataset;
                      const dataSetFileSuperRes = browser.params.precommit_scope.resources.superResolutionDataset;
                      const dataSetFileVggFaces2 = browser.params.precommit_scope.resources.VggFaces2Dataset;
                      const datasetFileImageNet200 = browser.params.precommit_scope.resources.imageNetDataset;
                      let subSet;
                      let dataSets;
                      let accuracyDrop;
                      let testUtils: TestUtils;
                      let inferenceUtils: InferenceUtils;
                      let helpers: Helpers;
                      let calibrationUtils: CalibrationUtils;

                      beforeAll(async () => {{
                        testUtils = new TestUtils();
                        inferenceUtils = new InferenceUtils(testUtils);
                        calibrationUtils = new CalibrationUtils(testUtils);
                        await testUtils.homePage.navigateTo();
                        await browser.sleep(1000);
                        await browser.refresh();
                        await LoginPage.authWithTokenOnLoginPage();
                        await testUtils.homePage.openConfigurationWizard();
                        datasetFileVOC.name = testUtils.helpers.generateName();
                        datasetFileImageNet.name = testUtils.helpers.generateName();
                        dataSetFileCoco.name = testUtils.helpers.generateName();
                        dataSetFileLFW.name = testUtils.helpers.generateName();
                        dataSetFileSuperRes.name = testUtils.helpers.generateName();
                        dataSetFileVggFaces2.name = testUtils.helpers.generateName();
                        datasetFileImageNet200.name = testUtils.helpers.generateName();
                        dataSets = [datasetFileVOC,
                                    datasetFileImageNet,
                                    dataSetFileCoco,
                                    dataSetFileLFW,
                                    dataSetFileSuperRes,
                                    dataSetFileVggFaces2,
                                    dataSetFileSemantic,
                                    datasetFileImageNet200];
                        await testUtils.uploadDatasets(dataSets);
                        helpers = new Helpers();
                      }});

                      beforeEach(async () => {{
                        console.log('Run new test');
                        await testUtils.homePage.navigateTo();
                        await browser.sleep(1000);
                        await browser.refresh();
                        await browser.sleep(1000);
                        await LoginPage.authWithTokenOnLoginPage();
                        await testUtils.homePage.openConfigurationWizard();
                        console.log('Set test params');
                        subSet = undefined;
                        accuracyDrop = undefined;
                        jasmine.DEFAULT_TIMEOUT_INTERVAL = {default_timeout};

                        for (let i = 0; i < updateModelsList.length; i++) {{
                          const name = updateModelsList[i];
                          const elem = timeoutModels[name];
                          if (browser.currentTest.description.includes(name)) {{
                            if (elem.timeout) {{
                              jasmine.DEFAULT_TIMEOUT_INTERVAL = Number(elem.timeout * {default_timeout});
                            }}
                            if (elem.subSet) {{
                              subSet = Number(elem.subSet);
                            }}
                            if (elem.accuracyDrop) {{
                              accuracyDrop = Number(elem.accuracyDrop);
                            }}
                            console.log(`Model: ${{name}}, accuracyDrop: ${{accuracyDrop}}, subSet: ${{subSet}}, timeout for test: ${{jasmine.DEFAULT_TIMEOUT_INTERVAL}}`);
                            break;
                          }}
                        }}
                        console.log('Clean artifacts after prev tests');
                        if (await testUtils.inferenceCard.taskIsRunningMessage('wb-info-hint').isPresent()) {{
                          console.log('Erase all');
                          testUtils.uploadedModels = [];
                          await testUtils.pressEraseAllButton();
                          await browser.sleep(10000);
                          await testUtils.homePage.openConfigurationWizard();
                          await testUtils.uploadDatasets(dataSets);
                        }} else if (testUtils.uploadedModels.length > 0) {{
                          try {{
                            await testUtils.deleteUploadedModels();
                          }} catch (e) {{
                            console.log(`Cant delete models: ${{testUtils.uploadedModels}}`);
                            console.log(e);
                          }} finally {{
                            testUtils.uploadedModels = [];
                          }}
                        }}
                      }});
                        ''').format(timeout_models=timeout_models, default_timeout=int(default_timeout / 2)))


def write_footer(path_test):
    with open(path_test, 'a') as file:
        file.write(textwrap.dedent('''\
                      afterEach(async () => {
                        await TestUtils.getBrowserLogs();
                      });

                      afterAll(async () => {
                        console.log('Tests end. Erase all');
                        await testUtils.pressEraseAllButton();
                        await browser.sleep(10000);
                      });
                    });
                    '''))


def write_body(path_test: str,
               models: list,
               updates: dict,
               algorithm: QuantizationAlgorithmEnum,
               precommit: int):
    with open(path_test, 'a') as file:
        for model in models:
            tpl_string = ''
            name = model['name']
            for precision in model['precision']:
                if precommit == 1 and precision == 'FP32':
                    continue
                data_set = select_dataset(model['task_type'], name)
                skip_it = update_spec(name, precision, algorithm, updates)
                layouts = get_layouts(name, updates)
                just_inference = 'INT8' in precision
                if just_inference:
                    tpl_string += get_test(just_inference,
                                           name,
                                           precision,
                                           model['framework'],
                                           data_set,
                                           skip_it,
                                           None,
                                           layouts)
                else:
                    tpl_string += get_test(just_inference,
                                           name,
                                           precision,
                                           adapt_framework(model['framework']),
                                           data_set,
                                           skip_it,
                                           algorithm,
                                           layouts)
            file.write(textwrap.dedent(tpl_string))


def get_test(just_inference, name, precision, framework, data_set, skip, algorithm, layouts):
    result = ''
    result += get_test_header(name, precision, framework, data_set, skip, algorithm, layouts)
    if just_inference:
        result += get_inference_body(precision)
    else:
        result += get_int8_body(precision, algorithm)
    result += get_test_footer()
    return result


def get_test_header(name, precision, framework, data_set, skip_it, algorithm, layouts):
    return '''
        {skip_it}(`Run inference, accuracy and int8 tuning on {name} {precision} ({algorithm})`, async (done) => {{
          try {{
            const model = {{ name: '{name}', framework: ('{framework}' as Frameworks), layouts: [{layouts}] }};
            const datasetFile = {data_set};

            await testUtils.modelManagerPage.goToModelManager();
        '''.format(name=name,
                   precision=precision,
                   framework=framework,
                   data_set=data_set,
                   skip_it=skip_it,
                   algorithm=algorithm,
                   layouts=', '.join(map(lambda layer: f'\'{layer}\'', layouts))
                   )


def get_int8_body(precision, algorithm):
    preset = 'undefined'
    algorithm = 'OptimizationAlgorithm.DEFAULT' if algorithm == QuantizationAlgorithmEnum.default.value\
        else 'OptimizationAlgorithm.ACCURACY_AWARE'
    return '''
          const resultInt8 = await calibrationUtils.runInt8PipelineThroughDownloader(
            model,
            datasetFile,
            InferenceType.CPU,
            '{precision}',
            {algorithm},
            subSet,
            {preset},
            accuracyDrop
          );
          if (resultInt8 === undefined) {{
            const accuracy = await testUtils.accuracyReport.runAccuracyEvaluationAndRetrieveValue(
              model,
              true
            );
            console.log(`Accuracy check end: ${{accuracy}}`);
          }}
    '''.format(precision=precision, algorithm=algorithm, preset = preset)


def get_inference_body(precision):
    return '''
          await inferenceUtils.runInferencePipelineThroughDownloader(
            model,
            datasetFile,
            InferenceType.CPU,
            null,
            '{precision}',
            true
          );
    '''.format(precision=precision)


def get_test_footer():
    return '''
            done();
          } catch (err) {
            done.fail(err);
          }
        });
    '''


def generate_tests(path: str, models: list, updates: dict, algorithm: QuantizationAlgorithmEnum, is_precommit: int):
    write_header(path, updates)
    write_body(path,
               models,
               updates,
               algorithm,
               is_precommit)
    write_footer(path)


def select_dataset(type: str, model_name: str):
    zero_accuracy_model = {
      "mobilenet-v1-1.0-224": "datasetFileImageNet200",
      "repvgg-a0": "datasetFileImageNet200"
    }

    if model_name in zero_accuracy_model:
        return zero_accuracy_model[model_name]
    if type == 'classification':
        return 'datasetFileImageNet'
    elif type == 'object_detection':
        return 'datasetFileVOC'
    elif type == 'face_recognition':
        return 'dataSetFileLFW'
    elif type == 'semantic_segmentation':
        return 'dataSetFileSemantic'
    elif type == 'super_resolution' or type == 'inpainting':
        return 'dataSetFileSuperRes'
    elif type == 'instance_segmentation':
        return 'dataSetFileCoco'
    elif type == 'landmark_detection':
        return 'dataSetFileVggFaces2'
    return 'dataSetFileCoco'


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--hostname',
                        nargs='?',
                        type=str)
    parser.add_argument('--tls',
                        nargs='?',
                        default=False,
                        type=int)
    parser.add_argument('--precommit',
                        type=int)
    return parser.parse_args()


def get_access_token(hostname, tls):
    url_login = f'{hostname}/{WORKBENCH_API_PREFIX}/auth/login'

    default_token_path = os.path.join(USER_TOKEN_DEFAULT_DIR, TOKEN_FILENAME)
    user_token_file_path = get_env_var('TOKEN_FILE_PATH', default_token_path)

    for i in range(0, tries_to_check_file_existence, 1):
        if not os.path.exists(user_token_file_path):
            print('Token file is not created at the moment. Retry in 2 seconds')
            time.sleep(2)
        else:
          break

    if not os.path.isfile(user_token_file_path):
        raise FileNotFoundError('Token file is not found in path {}'.format(user_token_file_path))

    with open(user_token_file_path, 'r') as token_file:
        login_token = token_file.read()

    json_data = { 'token': login_token, 'username': DEFAULT_USERNAME }

    if tls:
        response = requests.post(url_login, json=json_data, proxies=empty_proxies, verify=False)
    else:
        response = requests.post(url_login, json=json_data, proxies=empty_proxies)
    response_json = response.json()
    return response_json['accessToken']


def get_models(hostname, access_token, tls):
    url = f'{hostname}/{WORKBENCH_API_PREFIX}/downloader-models'
    header = {
        'Authorization': 'Bearer {}'.format(access_token)
    }
    if tls:
        req = requests.get(url, headers=header, proxies=empty_proxies, verify=False)
    else:
        req = requests.get(url, headers=header, proxies=empty_proxies)
    return req.json()


def clean_precision(model: dict, delete_precision: list):
    current_model = copy.deepcopy(model)
    for item in delete_precision:
        if item in current_model['precision'] and 'INT8' in current_model['precision']:
            current_model['precision'].remove(item)
    return current_model


def get_path_and_models(models: list, root: str, current_framework: str, algorithm: str, is_int8: bool):
    name = 'nightly-omz-{framework}-{algorithm}.e2e-spec.ts'.format(framework=current_framework, algorithm=algorithm)
    file_path = os.path.join(root, 'e2e', 'src', name)
    filter_models = list(filter(lambda model: model['framework'] == framework, models))
    if is_int8:
        update_models = [clean_precision(filter_model, ['FP16', 'FP32']) for filter_model in filter_models]
    else:
        update_models = [clean_precision(filter_model, ['INT8']) for filter_model in filter_models]
    return file_path, update_models


def get_data_from_files(path: str) -> tuple:
    #  Properties to disable
    #   'disable_precision': 'precisions'
    #   'disable_presets': {
    #     'AccuracyAwareQuantization': 'task_number',
    #     'DefaultQuantization': 'task_number'
    #   }
    with open(os.path.join(path, 'models.json')) as file:
        models_json = json.load(file)

    return models_json


def adapt_framework(framework_name: str) -> str:
    if framework_name == 'tf':
        return 'tensorflow'
    return framework_name

if __name__ == '__main__':
    urllib3.disable_warnings()
    arg = parse_arguments()

    update_tests = get_data_from_files(os.path.dirname(__file__))

    access_token = get_access_token(arg.hostname, arg.tls)
    data = get_models(arg.hostname, access_token, arg.tls)
    data_models = list(filter(lambda model: model['framework'] == 'openvino', data))
    if arg.precommit:
        path_to_file = os.path.join(root_folder, 'e2e', 'src', 'smoke-nightly.e2e-spec.ts')
        precommit_data = list(
          filter(lambda model: model['name'] == 'mobilenet-v2', data)
        )
        generate_tests(path_to_file, precommit_data, update_tests, QuantizationAlgorithmEnum.default.value, arg.precommit)
    else:
        for framework in frameworks:
            for current_algorithm in algorithms:
                path_to_file, framework_models = \
                    get_path_and_models(data, root_folder, framework, current_algorithm.value, False)
                generate_tests(path_to_file, framework_models, update_tests, current_algorithm.value, arg.precommit)
                if framework == 'openvino':
                    path_to_file, framework_models = \
                        get_path_and_models(data, root_folder, framework, 'int8', True)
                    generate_tests(path_to_file, framework_models, update_tests, current_algorithm.value, arg.precommit)
