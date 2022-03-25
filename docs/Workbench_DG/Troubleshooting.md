# Troubleshooting {#workbench_docs_Workbench_DG_Troubleshooting}

@sphinxdirective

.. toctree::
   :maxdepth: 1
   :hidden:
   
   workbench_docs_Workbench_DG_DC_Troubleshooting

@endsphinxdirective

If you encounter an issue when running the DL Workbench, follow the steps below:
1. Refresh the page.
2. If it does not help, search for the solution among the issues listed on this page.
3. If you could not find the issue on this page or the proposed solution did not work for
   you, <a href="#download-logs">download logs</a> and post a question at the [Intel Community Forum](https://community.intel.com/t5/Intel-Distribution-of-OpenVINO/bd-p/distribution-openvino-toolkit).
   Describe your issue providing the details necessary to reproduce it and attach
   screenshots, if possible.

If you run the DL Workbench in the Intel® DevCloud for the Edge, see [Troubleshooting for DL Workbench in the DevCloud](DC_Troubleshooting.md).

## <a name="download-logs">How to Investigate an Issue</a>

To learn more about an error, download a `.txt` file with server logs. 
Click the *user icon* in the upper-right corner to see the **Settings**, then click **Download Log**:  
![](img/authentication/download_logs.png)

> **NOTE**: Server logs contain sensitive information like data on your models. If you do not wish to share this information, attach only the `RUN COMMAND` part.

If you cannot copy the logs from the DL Workbench UI, use the following command to download logs:

```bash
docker cp workbench:/home/workbench/.workbench/server.log server.log
```

If the issue persists, [post a question on Intel Community Forum](https://community.intel.com/t5/Intel-Distribution-of-OpenVINO/bd-p/distribution-openvino-toolkit) and attach the server logs. If the issue is not reproduced in the container, feel free to [post a question](https://community.intel.com/t5/Intel-Distribution-of-OpenVINO/bd-p/distribution-openvino-toolkit)  as well.
For more information, go to the **Enter Docker Container** section of the [Work with Docker Container](Docker_Container.md) page.  


## Most Frequent Issues

### General

- <a href="#container">Docker container stops</a>
- <a href="#incompatible">Incompatible model and dataset</a>
- <a href="#archive">Wrong archive</a>
- <a href="#omz">Open Model Zoo models do not get imported</a>
- <a href="#nginx">Nginx fails to start</a>
- <a href="#failed-to-upgrade">Unable to upgrade the DL Workbench to the highest version</a>

### Remote Target

- <a href="#sudo">Warning: No sudo privileges</a>
- <a href="#dependencies">Warning: GPU drivers setup fails</a>
- <a href="#authentication">Warning: Authentication Error</a>
- <a href="#py">Failure: Python version is not supported</a>
- <a href="#pip">Failure: pip version is not supported</a>
- <a href="#os">Failure: OS version is not supported</a>
- <a href="#internet">Failure: No internet connection</a>

## General Issues

### <a name="container">Docker Container Stops</a>

This error appears due to the incorrect permissions that are set for the configuration folder on a
host machine with Linux\* or macOS\*.

The indicator of the problem is the following output in the terminal:
```bash
[tasks]
  . app.main.tasks.task.Task
  . celery.accumulate
  . celery.backend_cleanup
  . celery.chain
  . celery.chord
  . celery.chord_unlock
  . celery.chunks
  . celery.group
  . celery.map
  . celery.starmap

Error: No nodes replied within time constraint.
Celery is not ready at the moment. Retry in 2 seconds

username@host:~$
```

To resolve the problem, follow the steps below:

1. Create the configuration folder with the correct permissions manually. Run the following command
in your terminal:
> **NOTE**: If the configuration folder already exists, delete it before proceeding.
```bash
mkdir -p -m 777 ~/.workbench
```

2. Copy required DL Workbench assets into it. Assign this path to the
`--assets-directory` argument in the script you used to 
[install the application](Installation.md). 

> **NOTE**: 
> * If you use a non-default configuration directory, replace `~/.workbench` with it.
> * Creating the directory with the `-m 777` mode makes the directory accessible to ALL
> users for reading, writing and executing.

### <a name="incompatible">Incompatible Model and Dataset</a>

![](img/troubleshooting_model_dataset_01-b.png)

This error appears due to model and dataset type incompatibility.

* Make sure you select a correct model task in the [Accuracy Settings step](Configure_Accuracy_Settings.md).

![](img/configurator_usage-b.png)

Also, check that you do not select a VOC Object-Detection dataset for a Classification model, or an ImageNet Classification dataset for an Object-Detection model.

### <a name="omz">Open Model Zoo Models Do Not Get Imported</a>

If you cannot import models from the Open Model Zoo, you may need to specify
your proxy settings when running a Docker container. To do that, refer to [Advanced Configurations](Advanced_Config.md).

If you cannot download a model from the Open Model Zoo because its source is not available, you can select a different model of the same use case from another source. If you have a problem with connectivity, you may need to check the internet connection and specify your proxy settings.


### <a name="nginx">Nginx Fails to Start</a>

The error shown below may appear due to incorrect user permissions set for an SSL 
key and/or SSL certificate.

![](img/ssl_files_permissions.png)

Check the key and certificate permissions. They must have at least **4 
mode, which means reading for `others` group.

To resolve the problem, run the command below in your terminal and then restart the DL Workbench.
> **NOTE**: The command makes the provided files accessible for reading to 
> **all** users.
```bash
chmod 004 <path-to-key>/key.pem
chmod 004 <path-to-certificate>/certificate.pem
```

### <a name="failed-to-upgrade">Unable to Upgrade the DL Workbench to the Highest Version</a>

When the DL Workbench is unable to [upgrade to the highest version](Docker_Container.md), you can run the highest DL Workbench version without your data or use the previous DL Workbench version to keep your data in the tool.
Choose the solution that suits you best:

* Use the highest DL Workbench version and totally remove the previous data including your models, datasets, and performance information. Run the following commands in your terminal.
   1. Remove the previous folder or volume with data:
      * Linux and macOS: `rm -rf ~/.workbench/*`
      * Windows: `docker volume rm workbench_volume` and `docker volume create workbench_volume`
   2. Run a new DL Workbench container.
   
* Use the highest DL Workbench version and save the previous data locally, which however will not make the data available in the tool. Run the following commands in your terminal.
   1. Create a new local directory or volume:
      * Linux and macOS: `mkdir -p -m 777 ~/.workbench_new`
      * Windows: `docker volume create workbench_volume_new`
   2. Run a new DL Workbench contatiner with the new local folder or volume mounted to the container.
   
* Save the previous data and use the previous version of DL Workbench. Open your terminal and run the starting command *that you used previously*, but specifying the tag of the previous version.

## Remote Target Issues

### <a name="sudo">Remote Target Warning: No Sudo Privileges</a>

If the specified user has no sudo privileges on the remote machine, only a CPU device is available
for inference. If you want to profile on GPU and MYRIAD devices, follow the steps described in
the **Configure Sudo Privileges without Password** section of 
[Set Up Remote Target](Setup_Remote_Target.md).

### <a name="dependencies">Remote Target Warning: GPU Drivers Setup Fails</a>

If the automatic setup of GPU drivers fails, install dependencies on the remote target machine
manually as described in the **Install Dependencies on Remote Target Manually** section of 
[Set Up Remote Target](Setup_Remote_Target.md).

### <a name="authentication">Remote Target Failure: Authentication Error</a>

![](img/remote_profiling/authenticationerror.png)

Check the following parameters if you can not authenticate to the remote machine:

**Hostname**

Make sure you provide the [hostname](https://en.ryte.com/wiki/Hostname#:~:text=A%20hostname%20is%20a%20unique,multiple%20domains%20under%20one%20host.) 
of your machine or its [IPv4 address](https://en.wikipedia.org/wiki/IPv4#:~:text=Internet%20Protocol%20version%204%20(IPv4,in%20the%20ARPANET%20in%201983.)).

Examples:
* Hostname: *host.com*, *sub-domain1.sub-domain2.host.com* 
* IP address: *192.0.2.235*

**User Name**

Check the [user name](https://www.google.com/amp/s/www.cyberciti.biz/faq/appleosx-bsd-shell-script-get-current-user/amp/) 
for the SSH connection to the remote machine. 

Examples:
* *root*
* *username*

**SSH Key**

Make sure you upload the `id_rsa` key generated when you 
[set up the remote target](Setup_Remote_Target.md).

You should upload the [`id_rsa` key](Setup_Remote_Target.md), which contains a
set of symbols surrounded by the lines shown below:
```
-----BEGIN RSA PRIVATE KEY-----
```
```
-----END OPENSSH PRIVATE KEY-----
```

### <a name="py">Remote Target Failure: Python* Version Is Not Supported</a>

Make sure you have Python\* 3.6, 3.7, or 3.8 on your target machine. See 
[Set Up Remote Target](Setup_Remote_Target.md) 
for dependencies instructions and the full list of remote target requirements.

### <a name="pip">Remote Target Failure: Pip* Version Is Not Supported</a>

Make sure you have pip\* 18 on your target machine. 
See [Set Up Remote Target](Setup_Remote_Target.md) 
for dependencies  instructions and the full list of remote target requirements.

### <a name="os">Remote Target Failure: OS Version Is Not Supported</a>

Make sure you have Ubuntu\* 18.04 on your target machine. See [Set Up Remote Target](Setup_Remote_Target.md) for the full list of remote target requirements.

### <a name="internet">Remote Target Failure: No Internet Connection</a>

This failure may occur due to incorrectly set or missing proxy settings. Set the proxies as described in [Register Remote Target in the DL Workbench](Add_Remote_Target.md). To update remote machine information, see [Profile with Remote Machine](Profile_on_Remote_Machine.md)

---
## See Also

* [Troubleshooting for DL Workbench in the Intel® DevCloud for the Edge](DC_Troubleshooting.md)
* [Work with Docker Container](Docker_Container.md)

