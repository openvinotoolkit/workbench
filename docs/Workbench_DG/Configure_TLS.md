# Configure Transport Layer Security (TLS) {#workbench_docs_Workbench_DG_Configure_TLS}

Three environment variables below enable you to use a self-signed certificate with OpenSSL\* for the
DL Workbench:

Docker `docker run` command:

Variable | Explanation
---|---
`-SSL_CERT`, `-e SSL_CERT` | Sets the path to the DL Workbench web app TLS certificate in the container.
`-SSL_KEY`,  `-e SSL_KEY`| Sets the path to the `SSL_CERT` certificate private key in the container.
`-SSL_VERIFY`, `-e SSL_VERIFY` | Indicates whether the `SSL_CERT` TLS certificate is trusted (`on`, default), or either self-signed or untrusted (`off`). 

Python Starter `openvino-workbench` command:

Variable | Explanation
---|---
| `--ssl-certificate-name` | Specifies the path to the DL Workbench web app TLS certificate in the DL Workbench configuration directory. The file should be placed in "assets_dir" folder. Example: <certificate.pem>. 
| `--ssl-key-name` | Specifies the path to the --ssl-certificate certificate private key in the DL Workbench configuration directory. 
| `--verify-ssl` | Indicates whether the --ssl-certificate TLS certificate is trusted (`on`), or either self-signed or untrusted (`off`).

Follow instructions for your system and certificate status in the sections below.

## Trusted Certificate on Linux*

**When installing from Docker Hub* with the `openvino-workbench` script**:
1. In the directory with the script, create the `assets` folder with read, write, and execute
   permissions: 
```
mkdir -p -m 777 assets
```
2. Put your trusted key and certificate in the `assets` folder.
3. Run the Docker container with the command that mounts the directory with the `assets` folder to the
`/home/workbench/.workbench` directory in the Docker container and provides paths to the key and certificate:
```
openvino-workbench --image openvino/workbench \
  --assets-directory <full_path_to_assets>/assets \
  --ssl-certificate-name <full_path_to_assets>/assets/certificate.pem \
  --ssl-key-name <full_path_to_assets>/assets/key.pem
```
> **NOTE**: Replace the placeholders in angle brackets the full path to the `assets` folder.


## Self-Signed Certificate on Linux

**When installing from Docker Hub\* with the `openvino-workbench` script**:
1. In the directory with the `openvino-workbench` script, create the `assets` folder with read,
   write, and execute permissions:
```
mkdir -p -m 777 assets
```
2. Generate a self-signed certificate for non-production purposes in the `assets` folder:
```
openssl req -newkey rsa:4096 -nodes -keyout assets/key.pem -x509 -days 365 -out assets/certificate.pem
```
Follow the command-line instructions to provide the required data.
3. Run the Docker container with the command that mounts the directory with the `assets` folder to the
`/home/workbench/.workbench` directory in the Docker container and provides paths to the key and certificate:
```
openvino-workbench --image openvino/workbench \
  --assets-directory <full_path_to_assets>/assets \
  --ssl-certificate-name <full_path_to_assets>/assets/certificate.pem \
  --ssl-key-name <full_path_to_assets>/assets/key.pem \
  --verify-ssl off
```
> **NOTE**: Replace the placeholders in angle brackets the full path to the `assets` folder.

## Trusted Certificate on Windows*

1. Open a terminal and create the `workbench_volume` volume:
```
docker volume create workbench_volume
```
2. Put your trusted key and certificate in the `workbench_volume` volume:
```
docker run --rm -v workbench_volume:/data -v <full_path_to_certificates_folder>:/cert_data busybox sh -c "cp /cert_data/key.pem /data && cp /cert_data/certificate.pem /data && chown -R 5665 /data"
```
3. Run the Docker container with the command that mounts the `workbench_volume` volume to the
`/home/workbench/.workbench` directory in the Docker container and provide key and certificate paths:
~~~
docker run -p 127.0.0.1:5665:5665 `
           --name workbench `
           --volume workbench_volume:/home/workbench/.workbench `
           -e SSL_CERT=/home/workbench/.workbench/certificate.pem `
           -e SSL_KEY=/home/workbench/.workbench/key.pem `
           -it openvino/workbench:latest
~~~

## Self-Signed Certificate on Windows

**Step 1.** Open a terminal, create the `workbench` directory and go to this directory:

```
mkdir workbench
```

```
cd workbench
```

**Step 2.** Generate a self-signed certificate for non-production purposes in the `workbench` folder:
```
openssl req -newkey rsa:4096 -nodes -keyout workbench/key.pem -x509 -days 365 -out workbench/certificate.pem 
```
**Step 3.** Create the `workbench_volume` volume:
```
docker volume create workbench_volume
```
**Step 4.** Put your self-signed key and certificate in the `workbench_volume` volume:
```
docker run --rm -v workbench_volume:/data -v <full_path_to_certificates_folder>:/cert_data busybox sh -c "cp /cert_data/key.pem /data && cp /cert_data/certificate.pem /data && chown -R 5665 /data"
```
**Step 5.** Run the Docker container with the command that mounts the `workbench_volume` volume to the
`/home/workbench/.workbench` directory in the Docker container and provide key and certificate paths:
~~~
docker run -p 127.0.0.1:5665:5665 `
           --name workbench `
           --volume workbench_volume:/home/workbench/.workbench `
           -e SSL_CERT=/home/workbench/.workbench/certificate.pem `
           -e SSL_KEY=/home/workbench/.workbench/key.pem `
           -e SSL_VERIFY off
           -it openvino/workbench:latest
~~~

## Trusted Certificate on macOS*

1. In the `home` directory, create the `assets` folder with read, write, and execute
   permissions: 
```
mkdir -p -m 777 assets
```
2. Put your trusted key and certificate in the `assets` folder.
3. Run the Docker container with the command that mounts the `assets` folder to the
`/home/workbench/.workbench` directory in the Docker container:
```
docker run -p 127.0.0.1:5665:5665 \
           --name workbench \
           --volume /home/assets:/home/workbench/.workbench \
           -it openvino/workbench:latest \
           -e ASSETS_DIR home/assets \
           -e SSL_CERT certificate.pem \
           -e SSL_KEY key.pem
```

## Self-Signed Certificate on macOS

1. In the `home` directory, create the `assets` folder with read, write, and execute
   permissions: 
```
mkdir -p -m 777 assets
```
2. Generate a self-signed certificate for non-production purposes in the `workbench` folder:
```
openssl req -newkey rsa:4096 -nodes -keyout workbench/key.pem -x509 -days 365 -out workbench/certificate.pem 
```
3. Run the Docker container with the command that mounts the `assets` folder to the
`/home/workbench/.workbench` directory in the Docker container:
```
docker run -p 127.0.0.1:5665:5665 \
           --name workbench \
           --volume /home/assets:/home/workbench/.workbench \
           -it openvino/workbench:latest \
           -e ASSETS_DIR home/assets \
           -e SSL_CERT certificate.pem \
           -e SSL_KEY key.pem \
           -e SSL_VERIFY off
```

---
## See Also

* [Deep Learning Workbench Security](Security.md)
* [Enable Authentication in DL Workbench](Authentication.md)
* [Troubleshooting](Troubleshooting.md)