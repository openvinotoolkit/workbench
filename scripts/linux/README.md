# OpenVINO™ Deep Learning Workbench Python Starter

Deep Learning Workbench (DL Workbench) is an official UI environment of the OpenVINO™ toolkit.
The DL Workbench enables you to:

- Learn what neural networks are, how they work, and how to analyze their architectures and performance.
- Get familiar with the OpenVINO™ ecosystem and its main components without installing it on your system.
- Optimize your model and prepare it for deployment on the target system.

In the DL Workbench, you can use the following OpenVINO™ toolkit components:

* [Model Downloader](https://docs.openvinotoolkit.org/latest/omz_tools_downloader.html) to download models from the Intel® [Open Model Zoo](https://docs.openvinotoolkit.org/latest/trained_models.html) 
with pretrained models for a range of different tasks
* [Model Optimizer](https://docs.openvinotoolkit.org/latest/openvino_docs_MO_DG_Deep_Learning_Model_Optimizer_DevGuide.html) to transform models into
the Intermediate Representation (IR) format
* [Post-Training Optimization toolkit](https://docs.openvinotoolkit.org/latest/pot_README.html) to calibrate a model and then execute it in the
 INT8 precision
* [Accuracy Checker](https://docs.openvinotoolkit.org/latest/omz_tools_accuracy_checker.html) to determine the accuracy of a model
* [Benchmark Tool](https://docs.openvinotoolkit.org/latest/openvino_inference_engine_tools_benchmark_tool_README.html) to estimate deep learning inference performance on supported devices
## System Requirements

### Recommended

Prerequisite | Linux* |
:----- | :-----
Operating system|Ubuntu\* 18.04|
CPU | Intel® Core™ i7|
GPU| Intel® Pentium® processor N4200/5 with Intel® HD Graphics |
HDDL, Myriad| Intel® Neural Compute Stick 2 <br> Intel® Vision Accelerator Design with Intel® Movidius™ VPUs|
Available RAM space| 8 GB\** |
Available storage space| 10 GB + space for imported artifacts|
Docker\*| Docker CE 18.06.1 |
Web browser| Google Chrome\* 83|
Resolution| 1440 x 890|
Internet|Required|
Installation method| From Docker Hub <br> From OpenVINO toolkit package|

> **NOTE**: You need more space if you optimize or measure accuracy of computationally expensive models,
> such as mask_rcnn_inception_v2_coco or faster-rcnn-resnet101-coco-sparse-60-0001.

## Install the DL Workbench Starter

### Step 1. Set Up Python Virtual Environment

To avoid dependency conflicts, use a virtual environment. Skip this step only if you do want to install all dependencies globally.

Create virtual environment by executing the following commands in your terminal:

```
python3 -m pip install virtualenv
python3 -m virtualenv venv
```

### Step 2. Activate Virtual Environment

```
source venv/bin/activate
```

### Step 3. Execute the install_dependencies Script

```bash
bash install_dependencies.sh
```

### Step 4. Verify the Installation
```
openvino-workbench --help
```
You will see the help message for the starting package if installation finished successfully.

## Use the DL Workbench Starter

To start the latest available version of DL Workbench, execute the following command:

```
openvino-workbench
```

You can see the list of available arguments with the following command:
```
openvino-workbench --help
```

Refer to the documentation for additional information.

## Learn More
* [Release Notes](https://software.intel.com/content/www/us/en/develop/articles/openvino-relnotes.html)
* [Documentation](https://docs.openvinotoolkit.org/latest/workbench_docs_Workbench_DG_Introduction.html)

# Licenses

**LEGAL NOTICE: By accessing, downloading or using this software and any required dependent software (the “Software Package”), you agree to the terms and conditions of the software license agreements for the Software Package, which may also include notices, disclaimers, or license terms for third party software included with the Software Package. Please refer to the “third-party-programs.txt” or other similarly-named text file for additional details.**

By downloading and using this container and the included software, you agree to the terms and
conditions of the [software license
agreements](https://software.intel.com/en-us/license/eula-for-intel-software-development-products).

As for any prebuilt image usage, it is the image user's responsibility to ensure that any use of
this image complies with any relevant licenses and potential fees for all software contained within.
We will have no indemnity or warranty coverage from suppliers.

Components:

* [Ubuntu](https://hub.docker.com/_/ubuntu)
* [Intel® Distribution of OpenVINO™
  toolkit](https://software.intel.com/en-us/license/eula-for-intel-software-development-products)