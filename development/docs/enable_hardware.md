# Instructions to enable GPU/VPUs hardware

## Enable Intel® Processor Graphics (GPU)

> **NOTES**: 
> - The steps in this section are required only if you want to enable the toolkit components to use processor graphics (GPU) on your system.
> - If you installed the Intel® Distribution of OpenVINO™ to the non-default install directory, replace `/opt/intel` with the directory in which you installed the software.

1. Go to the install_dependencies directory:
```sh
cd /opt/intel/openvino_2022/install_dependencies/
```
2. Enter the super user mode:
```sh
sudo -E su
```
3. Install the **Intel® Graphics Compute Runtime for OpenCL™** driver components required to use the GPU plugin and write custom layers for Intel® Integrated Graphics:
```sh
./install_NEO_OCL_driver.sh
```

## Enable Intel® Movidius™ Neural Compute Stick and Intel® Neural Compute Stick 2

> **NOTES**: 
> - These steps are only required if you want to perform inference on Intel® Movidius™ NCS powered by the Intel® Movidius™ Myriad™ 2 VPU or Intel® Neural Compute Stick 2 powered by the Intel® Movidius™ Myriad™ X VPU. See the [Get Started page for Intel® Neural Compute Stick 2:](https://software.intel.com/en-us/neural-compute-stick/get-started)
> - If you installed the Intel® Distribution of OpenVINO™ to the non-default install directory, replace `/opt/intel` with the directory in which you installed the software.

1. Add the current Linux user to the `users` group:
```sh
sudo usermod -a -G users "$(whoami)"
```
Log out and log in for the command to work.

2. To perform inference on Intel® Movidius™ Neural Compute Stick and Intel® Neural Compute Stick 2, install the USB rules as follows:
```sh
sudo cp /opt/intel/openvino_2022/inference_engine/external/97-myriad-usbboot.rules /etc/udev/rules.d/
```
```sh
sudo udevadm control --reload-rules
```
```sh
sudo udevadm trigger
```
```sh
sudo ldconfig
```
> **NOTE**: 
>You may need to reboot your machine for this to work.

## Enable Intel® Vision Accelerator Design with Intel® Movidius™ VPUs (HDDL)

> **NOTES**: 
> - These steps are only required if you want to perform inference on Intel® Vision Accelerator Design with Intel® Movidius™ VPUs.
> - If you installed the Intel® Distribution of OpenVINO™ to the non-default install directory, replace `/opt/intel` with the directory in which you installed the software.

For Intel® Vision Accelerator Design with Intel® Movidius™ VPUs, the following additional installation steps are required.

1. Set the environment variables:
```sh
source /opt/intel/openvino_2022/setupvars.sh
```
> **NOTE**:
> The `HDDL_INSTALL_DIR` variable is set to `<openvino_install_dir>/deployment_tools/inference_engine/external/hddl`. If you installed the Intel® Distribution of OpenVINO™ to the default install directory, the `HDDL_INSTALL_DIR` was set to `/opt/intel/openvino_2022/extras/inference_engine/external/hddl`.

2. Install dependencies:
```sh
${HDDL_INSTALL_DIR}/install_IVAD_VPU_dependencies.sh
```
Note, if the Linux kernel is updated after the installation, it is required to install drivers again: 
```sh
cd ${HDDL_INSTALL_DIR}/drivers
```
```sh
sudo ./setup.sh install
```
Now the dependencies are installed and you are ready to use the Intel® Vision Accelerator Design with Intel® Movidius™ with the OpenVINO™.

> **NOTE**:
> For more details, visit the [link](https://docs.openvino.ai/latest/openvino_docs_install_guides_installing_openvino_ivad_vpu.html) 
