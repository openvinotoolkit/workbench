# Enable Authentication in DL Workbench {#workbench_docs_Workbench_DG_Authentication}

By default, the DL Workbench is started without authentication settings. This can cause
problems with sensitive data, like your model or performance information. It is
recommended to enable authentication when starting the DL Workbench.

## Enable Authentication 

To enable authentication, use `-e ENABLE_AUTH=1` when you start the DL Workbench with the
`docker run` command or `--enable-auth` with the `openvino-workbench` script:
* Example `docker run` command:
 ```bash
 docker run -p 127.0.0.1:5665:5665 --name workbench -e ENABLE_AUTH=1 -it openvino/workbench:2022.1
 ```

* Example `openvino-workbench` command:  
 ```bash
 openvino-workbench --image openvino/workbench:2022.1 --enable-authentication
 ```

When you enable authentication, the terminal displays the following when the Docker
container with the DL Workbench is up and running:

1. <a href="#url-token">One-time link with token</a>
2. <a href="#login-token">Login token</a>
3. <a href="#jupyter-token">JupyterLab\* token</a>

![](img/authentication/auth2.png)

## Configure Authentication 

To set up your own login token, use `-e CUSTOM_TOKEN=<token>` when you start the DL Workbench with the
`docker run` command or `--custom-token <token>` with the `openvino-workbench` script:
* Example `docker run` command:
 ```bash
 docker run -p 127.0.0.1:5665:5665 --name workbench -e ENABLE_AUTH=1 -e CUSTOM_TOKEN=MY_CUSTOM_TOKEN -it openvino/workbench:2022.1
 ```

* Example `openvino-workbench` command:  
 ```bash
 openvino-workbench --image openvino/workbench:2022.1 --enable-authentication --custom-token MY_CUSTOM_TOKEN
 ```

## How to Use Tokens

### <a name="url-token"> One-Time Link with Token </a>

The link is provided to
make it easy for you to go to the DL Workbench for the first time. For each new container,
a unique one-time link is generated and expires once you click it. Use this link to access
the DL Workbench for the first time. When you click the link, the DL Workbench 
**Active Projects** page appears, and you can move on to [work with models and sample datasets](Work_with_Models_and_Sample_Datasets.md)
by clicking **Create Project**: 
![](img/start_page_crop.png)

Accept or block cookies in the pop-up window. You can change your decision later on the
**Settings** panel. 
![](img/pop_up_cookies.png)

### <a name="login-token">Login Token</a>

The login token is valid as long as you do not remove the current Docker container, so
treat the token as a password for the current DL Workbench session. Use it whenever you
see the **Enter OpenVINO DL Workbench** window.

Open the http://127.0.0.1:5665 link without the
URL token, and the **Enter OpenVINO DL Workbench** page appears. Copy the login token from
the console and paste it into the field:  
![](img/authentication/auth1.png) 

> **NOTE**: The token is also saved to a folder inside a Docker container, and you can
> obtain it with the command below: 
    ```bash 
    docker cp workbench:/home/workbench/.workbench/token.txt token.txt
    ```
> If you do not want to save the token inside a Docker container, use `SAVE_TOKEN_TO_FILE=0` 
> when you start the DL Workbench with the `docker run` command or `--disable-token-saving` 
> with the `openvino-workbench` script.

Press **Start**. The **Start Page** appears, and you can move on to
[work with models and sample datasets](Work_with_Models_and_Sample_Datasets.md) by clicking **Create Project**. 
![](img/start_page_crop.png)


Accept or block cookies in the pop-up window. You can change your decision later on the
**Settings** panel.
![](img/pop_up_cookies.png)

### <a name="jupyter-token">JupyterLab Token</a>

Use this token when you access the [JupyterLab Environment](Jupyter_Notebooks.md) delivered by the DL Workbench. This token is valid as long as you do not remove the current Docker container.
![](img/authentication/auth4.png)

---
## See Also

* [Deep Learning Workbench Security](Security.md)
* [Configure Transport Layer Security (TLS)](Configure_TLS.md)
* [Troubleshooting](Troubleshooting.md)

