# Running Local Benchmark Performance Test

## Prerequisites

1. Installed Docker
2. Pulled DL Workbench Docker image to run tests 
3. Pulled DL Workbench git repository 
4. Existing resources (model(s) and dataset(s)) to run benchmark performance tests 


## Preparation

1. Prepare and move resources files with respect to specific file structure:
   1. Create a directory on your local file system (e.g. `~/.wb_resources`) to keep resources files
   2. Move models and datasets files to this resources directory keeping file structure similar to the shared drive used in e2e tests:
      Example:
  ```
  ~/.wb_resources
    |- models
    |  |- IR
    |     |- OD
    |        |- yolo_v2
    |           |- yolo_v2.xml
    |           |- yolo_v2.bin
    |- datasets
       |- VOC_small.tar.gz
       |- imagenet10.tar.gz
  ```
2. Update script for running benchmark performance test:
   1. Open `tests/benchmark_performance_tests/run_performance_test_with_docker.sh` script in editor
   2. Set `RESOURCES_PATH` environment variable (Line 10) with path to your local resources directory (e.g. `~/.wb_resources`)
   3. Set `IMAGE_NAME` and `IMAGE_TAG` environment variables (Line 14-15) with your pulled Docker image parameters

3. Prepare client e2e tests and its dependencies
   1. Navigate to DL Workbench client directory (`cd client`)
   2. Install node modules if you don't have them (`npm i`)
   3. Update chromedriver if needed:
   ```shell
   ./node_modules/protractor/bin/webdriver-manager clean
   ./node_modules/protractor/bin/webdriver-manager update
   ```
   4. Navigate back to the DL Workbench server repository root (`cd ..`)


## Running tests

1. Open DL Workbench server repository root in the terminal
2. Run `tests/benchmark_performance_tests/run_performance_test_with_docker.sh` script
