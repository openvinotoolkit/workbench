# Work with Docker Container {#workbench_docs_Workbench_DG_Docker_Container}

When working with the application inside a Docker container, you might need to:

- <a href="#pause">Pause and resume a Docker container</a>
- <a href="#upgrade">Update the DL Workbench inside a Docker container</a> 
- <a href="#copy">Copy files from a Docker container</a>
- <a href="#enter">Enter a Docker container</a>

Refer to the sections below to see instructions for each scenario.

> **NOTE**: To learn about the commands, see [Advanced Configurations](Advanced_Config.md).

> **NOTE**: In the snippets below, replace `workbench` with the name of your container if you renamed it.

## <a name="pause">Pause and Resume Docker Container</a> 

To pause a container with the DL Workbench while keeping all your data in it, stop the container
and then restart it later to the previous state with the commands below: 

1. Stop the container:

```bash
docker stop workbench
```

* When the container was run in *interactive* mode:   
**Ctrl + C**

2. Restart the container:

@sphinxdirective
   
.. tab:: `docker run` *detached* mode command
   
   .. code-block:: 
   
      docker start workbench

.. tab:: `docker run` *interactive* mode command
   
   .. code-block:: 
   
      docker start -ai <container-name>

.. tab:: `openvino-workbench` command
      
   .. code-block:: 

      openvino-workbench --restart workbench
   
@endsphinxdirective

## <a name="upgrade">Upgrade the DL Workbench Inside a Docker Container</a>

To get the highest version of the application in your Docker container, pause the
container, pull the latest version, and run the container with the same folder or volume
that you mounted to your previous Docker container.

### 1. Stop Container

```bash
docker stop workbench
```

* When the container was run in *interactive* mode:   
**Ctrl + C**

### 2. Pull the Highest Version of the DL Workbench

@sphinxdirective
   
.. tab:: `docker`  command
   
  .. code-block:: 
   
      docker start workbench

.. tab:: `openvino-workbench` command
      
  .. code-block:: 

      openvino-workbench --image openvino/workbench:2022.1  
   
@endsphinxdirective


### 3. Start New Container

Mount the same folder or volume that you mounted to your previous Docker container and run
the new container. You can specify the name of the new container using the `--container-name` argument, 
for example, `workbench_2022.1`.

@sphinxdirective
   
.. tab:: `docker` command
   
  .. code-block:: 
   
        docker run -p 0.0.0.0:5665:5665 --name workbench_2022.1 -it openvino/workbench:2022.1 --assets-directory  ~/.workbench

.. tab:: `openvino-workbench` command
      
  .. code-block:: 

      openvino-workbench --image openvino/workbench:2022.1 --assets-directory ~/.workbench --container-name workbench_2022.1
   
@endsphinxdirective

For full instructions on running a container and description of the arguments in the command above, 
see the [Advanced Configurations](Advanced_Config.md) page.
    
Once the command executes, open the link https://127.0.0.1:5665 in your browser, and the DL Workbench 
**Start Page** appears:

![](img/start_page_crop.png)


## <a name="copy">Copy Files from Docker Container</a>
    
To copy files from the container, you do not need to enter it. Use `docker cp` command, for example, this command copies the token to your Desktop:

```bash 
docker cp <container_name>:/home/workbench/.workbench/token.txt token.txt
```

### Copy Server Logs

If you cannot copy the logs from the DL Workbench UI, use the following command:

```bash
docker cp workbench:/home/workbench/.workbench/server.log server.log
```

## <a name="enter">Enter Docker Container with DL Workbench</a>

> **NOTE**: For this step, the container must be running.

### 1. Enter Container

If you want to inspect the container, run the following command:

```bash
docker exec -it workbench /bin/bash
```
This command creates a new instance of a shell in the running Docker container
and gives you access to a bash console as an OpenVINO&trade; user.

If you want to change the container configurations, use:

```bash
docker exec -u root -it workbench /bin/bash
```

### 2. Inspect the Container

The container directory displayed in the terminal is `/opt/intel/openvino_2022/tools/workbench/`.

To see a list of files available inside the container, run `ls`.

> **NOTE**: The `/opt/intel/openvino/tools/workbench/` directory 
> inside the container includes a service folder `wb/data`. Make sure you do not 
> apply any changes to it.


### 3. Inspect Entry Point

Inspect entry point if you want to see the commands that run DL Workbench.

```bash
cat docker/scripts/docker-entrypoint.sh
```

### 4. Exit Container

To exit the container, run `exit` inside the container.

##  Clear All Files

The `rm` command clears all loaded models, datasets, experiments, and profiling data:

```bash       
docker rm workbench
```

---
## See Also

* [Advanced Configurations](Advanced_Config.md)
* [Troubleshooting](Troubleshooting.md)
* [Deep Learning Workbench Security](@ref openvino_docs_security_guide_workbench)