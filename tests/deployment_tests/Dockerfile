FROM BASE_IMAGE_UBUNTU

ARG CI_USER

ENV USER_NAME ${CI_USER}
ENV SCRIPTS_FOLDER /tmp/scripts
ENV LIB_FOLDER /tmp/packages
ENV MODEL_FOLDER /tmp/model
ENV PYTHON_ENV_PATH /tmp

USER root

RUN mkdir -m 777 /tmp/packages /tmp/scripts /tmp/model

RUN gpasswd -a ${USER_NAME} users && \
    gpasswd -a ${USER_NAME} video

COPY scripts/ ${SCRIPTS_FOLDER}
COPY packages/ ${LIB_FOLDER}
COPY model/ ${MODEL_FOLDER}

RUN rm /etc/apt/sources.list.d/github_git-lfs.list
RUN apt-get update && \
    apt install -y --no-install-recommends apt-utils \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-pip \
    python3-setuptools \
    python3-dev

RUN python3 -m pip install pip==19.3.1

RUN ${LIB_FOLDER}/scripts/setup.sh

USER ${USER_NAME}
