# Build custom DL Workbench image (from branch)

## Prepare repository:

Do the following steps from the `workbench` repository root.

1. Checkout to the desired branch;
2. Build static:
   1. Navigate to the `client` folder:
      ```bash
        cd client
      ```
   2. Execute the following command:
      ```bash
        DL_PROFILER_BACKEND_STATIC_PATH=../static/ npm run pack
      ```
4. After the process is complete, you will see a folder `static` in the `workbench` repository root.

## Copy necessary assets

1. Navigate back to the `workbench` folder:
   ```bash
     cd ..
   ```
2. Set the environment variable with the path to the `workbench` repository root:
   ```bash
     export PATH_TO_WB_REPO=$(pwd)
   ```
3. Create a temporary folder outside the repository;
   ```bash
     mkdir /tmp/build_wb && cd /tmp/build_wb
   ```
4. Inside the created folder, do the following:
   1. Copy the `workbench` repository inside the current folder:
    ```bash
      rsync -av --progress ${PATH_TO_WB_REPO} ./ --exclude={'venv','venv_tf2','tests','client','.git','wb/data'}  
    ```
    > Note: you can `--exclude` any folder, use relative to `workbench` path.
   2. Copy and prepare the Dockerfile:
      1. Copy the template from the `workbench` repository:
         ```bash
           cp ${PATH_TO_WB_REPO}/docker/dockerfiles/Dockerfile_install_from_openvino_image.template Dockerfile
         ```
      2. Change its first line to the `FROM {actual-image-repository}:{actual-image-tag}`

## Build the image
Do the following in the previously created folder.

1. Set `${IMAGE_NAME}`, `${IMAGE_TAG}`, `${HTTP_PROXY}`, `${HTTPS_PROXY}`, `${PACKAGE_LINK}`, `${WHEELS_LINK}` variables:
   * `${IMAGE_NAME}`, `${IMAGE_TAG}`: anything you like:
     * Example: `export IMAGE_NAME=wb`, `export IMAGE_TAG=pr_1306`
   * `${HTTP_PROXY}`, `${HTTPS_PROXY}`: currently set proxies if any.
   * `${PACKAGE_LINK}`, `${WHEELS_LINK}`: you can find the currently validated package and wheels and their links in the `${PATH_TO_WB_REPO}/automation/Jenkins/openvino_version.yml`.
     * You have to add the following to the end of the package link:
       * `deployment_archives`
2. Execute the following command inside the created folder:
   ```bash
     docker build -t ${IMAGE_NAME}:${IMAGE_TAG} . --no-cache --build-arg https_proxy=${HTTP_PROXY} --build-arg http_proxy=${HTTPS_PROXY} --build-arg no_proxy=localhost,127.0.0.1,intel.com,.intel.com --build-arg rabbitmq_password=openvino --build-arg db_password=openvino --build-arg PACKAGE_LINK=${PACKAGE_LINK}
   ```
   > Note: If there are no proxies on your machine, remove the proxy-related `--build-arg`s from the command.
     
## Use the image

1. You can start DL Workbench with the built image using the [Python Starter](https://pypi.org/project/openvino-workbench/) or with a plain Docker command.
