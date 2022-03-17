# Work with Docker* Container {#workbench_docs_Workbench_DG_Docker_Container}

When working with the application inside a Docker\* container, you might need to:

- <a href="#pause">Pause and resume a Docker container</a>
- <a href="#restart">Completely restart a Docker container</a>
- <a href="#update">Update the DL Workbench inside a Docker container</a> 
- <a href="#enter">Enter a Docker container</a>

Refer to the sections below to see instructions for each scenario.

> **NOTE**: Some commands differ among the detached and interactive modes of a container. 
> To learn about the modes, see [Advanced Configurations](Advanced_Config.md).

## <a name="pause">Pause and Resume Docker Container</a> 

To pause a container with the DL Workbench while keeping all your data in it, stop the container
and then restart it later to the previous state with the commands below: 

1. Stop the container:
  
    ```docker stop <container-name>```

    * When the container was run in *interactive* mode:   
    **Ctrl + C**


2. Restart the container:
    * Using `docker start` in *detached* mode:  
    ```docker start <container-name>```
    * Using `docker start` in *interactive* mode:  
    ```docker start -ai <container-name>```

## <a name="restart">Run New Docker Container with DL Workbench</a>
 
To start a new Docker container with the DL Workbench, stop and remove the current container, then run a new one.

### 1. Pause Container

```sh
docker stop <container-name>
```

* In the interactive mode:      
**Ctrl + C**

### 2. Remove Container

```sh        
docker rm <container-name>
```

> **NOTE**: The `rm` command clears all loaded models, datasets, experiments, and profiling data.

### 3. Run New Container

To run a new container on your OS, use the command from [installation form](Run_Workbench_Locally.md).
To run the DL Workbench with different parameters,
see [Advanced Configurations](Advanced_Config.md).


## <a name="update">Update the DL Workbench</a>

To get the highest version of the application in your Docker container, pause the container,
pull the `latest` version, and run the container.

> **NOTE**: Updating a container means building a new container on a newer image and not
> having your previous data in it. To keep your data in a new container, consider 
> <a href="#upgrade">upgrading the DL Workbench</a>.

### 1. Pause Container

```sh
docker stop <container-name>
```

* When the container was run in *interactive* mode:   
**Ctrl + C**

### 2. Pull the Highest Version of the DL Workbench

```sh
docker pull openvino/workbench:2021.4.2
```

### 3. Start New Container

```bash
openvino-workbench --image openvino/workbench:2021.4.2 --assets-directory ~/.workbench
```

For full instructions on running a container and description of the arguments in the command above, 
see the [Advanced Configurations](Advanced_Config.md) page.
    
Once the command executes, open the link https://127.0.0.1:5665 in your browser, and the DL Workbench 
**Start Page** appears:

![](img/start_page_crop.png)

### Upgrade the DL Workbench Inside a Docker Container

To get the highest version of the application in your Docker container, pause the
container, pull the `2021.4.2` version, and run the container with the same folder or volume
that you mounted to your previous Docker container.

#### 1. Stop Container

```sh
docker stop <container-name>
```

* When the container was run in *interactive* mode:   
**Ctrl + C**

#### 2. Pull the Highest Version of the DL Workbench

```sh
docker pull openvino/workbench:2021.4.2
```

#### 3. Start New Container

Mount the same folder or volume that you mounted to your previous Docker container and run
the new container. You can specify the name of the new container using the `--container-name` argument, 
for example, `workbench_2021.4`.

```bash
openvino-workbench --image openvino/workbench:2021.4.2 --assets-directory ~/.workbench
```

For full instructions on running a container and description of the arguments in the command above, 
see the [Advanced Configurations](Advanced_Config.md) page.
    
Once the command executes, open the link https://127.0.0.1:5665 in your browser, and the DL Workbench 
**Start Page** appears:

![](img/start_page_crop.png)

## <a name="enter">Enter Docker Container with DL Workbench</a>

> **NOTE**: For this step, the container must be running.

### 1. Enter Container

To enter the container, run the command:

```bash
docker exec -it workbench /bin/bash
```
This command creates a new instance of a shell in the running Docker container
and gives you access to a bash console as an OpenVINO&trade; user.

### 2. See Available Files

The container directory displayed in the terminal is `/opt/intel/openvino_2022/tools/workbench/`.

To see a list of files available inside the container, run `ls`.

> **NOTE**: The `/opt/intel/openvino/tools/workbench/` directory 
> inside the container includes a service folder `wb/data`. Make sure you do not 
> apply any changes to it.


### 3. Inspect Entry Point

```bash
cat docker-entrypoint.sh
```

### 4. Exit Container

To exit the container, run `exit` inside the container.


---
## See Also

* [Advanced Configurations](Advanced_Config.md)
* [Troubleshooting](Troubleshooting.md)
* [Deep Learning Workbench Security](@ref openvino_docs_security_guide_workbench)