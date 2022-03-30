FROM ${INTERNAL_DOCKER_REPOSITORY}

SHELL ["/bin/bash", "+x", "-c"]

ARG GIT_USER_NAME
ARG GIT_PASSWORD
ARG CI_USER

ENV USER_NAME ${CI_USER}
ENV HOME_DIR /home/${USER_NAME}

ENV OPENVINO_WORKBENCH_ROOT ${INTEL_OPENVINO_DIR}/workbench
ENV SERVER_MODE development
ENV VENV_TF2_PYTHON ${OPENVINO_WORKBENCH_ROOT}/.unified_venv/bin/python
ENV NVM_DIR ${HOME_DIR}/.nvm

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3-pip \
    python3-setuptools \
    python3-dev \
    # socketIO
    netbase \
    # pycoco
    build-essential \
    # accuracy-checker 0.9.0
    libgtk-3-0


RUN rm -rf ${OPENVINO_WORKBENCH_ROOT}
COPY --chown=${USER_NAME} . ${OPENVINO_WORKBENCH_ROOT}

RUN mkdir -p -m 777 ~/Downloads
RUN git config --global credential.helper "!f() { echo username=\\${GIT_USER_NAME}; echo password=\\${GIT_PASSWORD}; }; f"

WORKDIR ${OPENVINO_WORKBENCH_ROOT}
RUN automation/bootstrap/bootstrap_os.sh

WORKDIR ${OPENVINO_WORKBENCH_ROOT}/client
RUN . ${NVM_DIR}/nvm.sh && \
    DL_PROFILER_BACKEND_STATIC_PATH=/front npm run pack

WORKDIR ${OPENVINO_WORKBENCH_ROOT}
ENTRYPOINT ["bash", "docker/bootstrap/docker-entrypoint.sh"]
