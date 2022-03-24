# Advanced DL Workbench Configurations {#workbench_docs_Workbench_DG_Advanced_Configurations}

This document contains information on how to run DL Workbench in a more secure mode, the complete list of command-line interface arguments for Python Starter, and additional docker run command-line options.


##  Python Starter Command-Line Interface

@sphinxdirective
.. raw:: html

    <div class="collapsible-section">
@endsphinxdirective

Run this command to get a list of available starting arguments:

```bash
openvino-workbench --help
```
Python Starter arguments:

@sphinxdirective
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| Argument                          | Explanation                                                                                                                                                                                                                                                                                                | Default Value   |
+===================================+============================================================================================================================================================================================================================================================================================================+=================+
| ``--help``                        | Displays help message and exits the script.                                                                                                                                                                                                                                                                | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--image``                       | Specifies the DL Workbench Docker image name.                                                                                                                                                                                                                                                              |                 |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--force-pull``                  | Force-pull the specified image. Can be used to download a newer version of the DL Workbench image.                                                                                                                                                                                                         | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--ip``                          | Specifies the outside IP to set up the DL Workbench.                                                                                                                                                                                                                                                       | 0.0.0.0         |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--port``                        | Maps the Docker container port 5665 to the provided host port to get access to the DL Workbench from a web browser.                                                                                                                                                                                        | 5665            |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--container-name``              | Specifies the container name to use.                                                                                                                                                                                                                                                                       | workbench       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--detached``                    | Boolean. Enables the detached mode of the Docker container. Container logs will not be visible in the terminal.                                                                                                                                                                                            | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--enable-gpu``                  | Boolean. Adds a host device to the container. Enables the container to use GPU devices in the DL Workbench.                                                                                                                                                                                                | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--enable-myriad``               | Boolean. Mounts directory /dev/bus/usb to the Docker container and adds the rule with allowed devices list to the cgroup. Enables the container to use Intel® Neural Compute Stick 2 devices in the DL Workbench. Cannot be used when running with Vision Accelerator Design with Intel® Movidius™ VPUs.   | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--enable-hddl``                 | Boolean. Adds a host device to the container and mounts directory /var/tmp to the Docker container. Enables the container to use Vision Accelerator Design with Intel® Movidius™ VPUs in the DL Workbench. Cannot be used when running with Intel® Neural Compute Stick 2.                                 | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--assets-directory``            | Mounts a provided local folder to the /home/workbench/.workbench directory in the Docker container.                                                                                                                                                                                                        | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--http-proxy``                  | Specifies the HTTP proxy in the format http://:@:.                                                                                                                                                                                                                                                         | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--https-proxy``                 | Specifies the HTTPS proxy in the format https://:@:.                                                                                                                                                                                                                                                       | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--no-proxy``                    | Specifies the URLs that should be excluded from proxying in the format url1,url2,url3.                                                                                                                                                                                                                     | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--no-jupyter``                  | Disables the Jupyter server.                                                                                                                                                                                                                                                                               | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--enable-authentication``       | Boolean. Turns on authentication for the DL Workbench.                                                                                                                                                                                                                                                     | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--custom-token``                | Specifies the custom login token for enabled DL Workbench authentication.                                                                                                                                                                                                                                  | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--disable-token-saving``        | Boolean. Turns off saving of the login token to the file. By default, saving to the file is enabled.                                                                                                                                                                                                       | ``false``       |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--ssl-certificate-name``        | Specifies the path to the DL Workbench web app TLS certificate in the DL Workbench configuration directory. The file should be placed in "assets\_dir" folder. Example:                                                                                                                                    | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--ssl-key-name``                | Specifies the path to the SSL\_CERT certificate private key in the DL Workbench configuration directory.                                                                                                                                                                                                   | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--verify-ssl``                  | Indicates whether the SSL\_CERT TLS certificate is trusted (on), or either self-signed or untrusted (off).                                                                                                                                                                                                 | on              |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--cloud-service-address``       | Specifies the URL to a standalone cloud service that provides Intel(R) hardware capabilities for experiments.                                                                                                                                                                                              | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--cloud-service-session-ttl``   | Specifies the cloud service session time to live.                                                                                                                                                                                                                                                          | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--network-name``                | Specifies the name of a Docker network to run the Docker container in.                                                                                                                                                                                                                                     |                 |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--network-alias``               | Specifies the alias of the DL Workbench container in the network.                                                                                                                                                                                                                                          | N/A             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
| ``--base-prefix``                 | Specifies the base prefix of the DL Workbench web application.                                                                                                                                                                                                                                             | '/'             |
+-----------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------+
@endsphinxdirective

> **IMPORTANT**: Before using the `--assets-directory` argument: <br>
> 1. Make sure the directory you pass as a value of `--assets-directory` has read, 
> write, and execute 
> permissions set for **all** users. See [Troubleshooting](Troubleshooting.md) for details.
> 2. Linux only. Create a group called `workbench` and add the current user `<USERNAME>` to it. Use the commands below:  <br>
>   1. `sudo groupadd -g 5665 workbench` 
>   2. `sudo usermod -a -G 5665 <USERNAME>`


> **NOTE**: `--enable-myriad` and `--enable-hddl` cannot be set simultaneously because Intel® Neural Compute Stick 2 and Intel® Vision Accelerator Design with Intel® Movidius™ VPUs are incompatible and cannot be used in the DL Workbench together.


@sphinxdirective
.. raw:: html

    </div>
@endsphinxdirective


##  Docker Run Command-Line Interface

@sphinxdirective
.. raw:: html

    <div class="collapsible-section">
@endsphinxdirective

You can run Docker containers with the following arguments:   

Argument| Explanation 
--- | :--- 
`-p 127.0.0.1:5665:5665`  |  Maps Docker container port `5665` to host port `5665` to get access to the DL Workbench from a web browser. 
`--device /dev/dri`  | Add a host device to the container. Enables the container to use GPU devices in the DL Workbench. Linux only.
`-v /dev/bus/usb:/dev/bus/usb` | Mounts directory `/dev/bus/usb` to the Docker container. Enables the container to use Intel® Neural Compute Stick 2 devices in the DL Workbench.  Linux only. *Cannot be used when running with Vision Accelerator Design with Intel® Movidius™ VPUs.* 
``--device-cgroup-rule='c 189:* rmw'`` | Adds the rule with allowed devices list to the cgroup. Enables the container to use Intel® Neural Compute Stick 2 devices in the DL Workbench. Linux only. *Cannot be used when running with Vision Accelerator Design with Intel® Movidius™ VPUs.* 
`--device /dev/ion:/dev/ion` | Add a host device to the container. Enables the container to use Vision Accelerator Design with Intel® Movidius™ VPUs in the DL Workbench. Linux only.*Cannot be used when running with Intel® Neural Compute Stick 2.*
`-v /var/tmp:/var/tmp`| Mounts directory `/var/tmp` to the Docker container. Enables the container to use Vision Accelerator Design with Intel® Movidius™ VPUs devices in the DL Workbench.  Linux only. *Cannot be used when running with Intel® Neural Compute Stick 2.*
`-it`  | Enables the interactive mode of the Docker container. Set to the Docker image name `workbench`. Docker container allows interactive processes in the DL Workbench terminal. To stop a container in this mode, press *Ctrl + C*.
`-d`  | Enables the detached mode of the Docker container. Set to the Docker image name `workbench`. Docker container runs in the background of your terminal and does not receive input or display output. To stop a container in this mode, run the `docker stop workbench` command.    
`--volume ~/.workbench:/home/workbench/.workbench`| Mounts a local folder named `~/.workbench` to the `/home/workbench/.workbench` directory in the Docker\* container
`-e https_proxy=<https-proxy>`<br><br>`-e http_proxy=<http-proxy>`<br><br> `-e no_proxy=<no-proxy>`  |  Optional. If you are behind a corporate proxy, set environment variables. 
`-e ENABLE_AUTH=1`  | **Boolean.** Turns on authentication for the DL Workbench. 
`-e CUSTOM_TOKEN=<custom-token>`  | Specifies a custom login token for enabled DL Workbench authentication. By default, a login token is generated automatically. 
`-e SAVE_TOKEN_TO_FILE=0`  | **Boolean.** Turns off saving of the login token to the file. By default, saving to the file is enabled. 
`-e BASE_PREFIX=<base-prefix>`  | Specifies the base prefix of the DL Workbench web application. Default value is '/'.

For other options, like launching the DL Workbench container or restarting the container, see [Docker Container section](Docker_Container.md).

@sphinxdirective
.. raw:: html

    </div>
@endsphinxdirective


## Run DL Workbench Securely

By default, the DL Workbench is started without authentication settings. If you want to protect your sensitive data, like the model details or performance information, you can [enable authentication](https://docs.openvinotoolkit.org/latest/workbench_docs_Workbench_DG_Authentication.html) in DL Workbench and use a [self-signed certificate](https://docs.openvinotoolkit.org/latest/workbench_docs_Workbench_DG_Configure_TLS.html).


## Disable JupyterLab inside DL Workbench 

[Jupyter notebooks](Jupyter_Notebooks.md) running in the same Docker container as the DL Workbench can impact inference results of experiments inside the DL Workbench. To get more accurate performance information, you might want to disable JupyterLab Environment. Use the `DISABLE_JUPYTER` or `--no-jupyter` argument when starting the DL Workbench. For example:  

@sphinxdirective
   
.. tab:: `docker run` command
   
  .. code-block:: 
   
       docker run -p 127.0.0.1:5665:5665 --name workbench -e DISABLE_JUPYTER=1 -it openvino/workbench:latest

.. tab:: `openvino-workbench` command
      
  .. code-block:: 

      openvino-workbench --image openvino/workbench:2022.1 --no-jupyter	
   
@endsphinxdirective

---
## See Also

* [Next Step: Get Started with DL Workbench](Work_with_Models_and_Sample_Datasets.md)
* [Troubleshooting](Troubleshooting.md)
