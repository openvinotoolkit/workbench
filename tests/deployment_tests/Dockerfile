FROM BASE_IMAGE_UBUNTU

ARG CI_USER

ENV USER_NAME ${CI_USER}
ENV SCRIPTS_FOLDER /tmp/scripts
ENV LIB_FOLDER /tmp/packages
ENV MODEL_FOLDER /tmp/model
ENV PYTHON_ENV_PATH /tmp

USER root

RUN mkdir -m 777 /tmp/packages /tmp/scripts /tmp/model

RUN useradd -ms /bin/bash ${USER_NAME}

RUN gpasswd -a ${USER_NAME} users && \
    gpasswd -a ${USER_NAME} video

COPY scripts/ ${SCRIPTS_FOLDER}
COPY packages/ ${LIB_FOLDER}
COPY model/ ${MODEL_FOLDER}

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt install -y --no-install-recommends apt-utils \
    software-properties-common \
    build-essential \
    libssl-dev \
    libpugixml-dev \
    libffi-dev && \
    add-apt-repository -y ppa:deadsnakes && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3.8 && \
    rm -rf /usr/bin/python /usr/bin/python3 && \
    ln -s /usr/bin/python3.8 /usr/bin/python && \
    ln -s /usr/bin/python3.8 /usr/bin/python3 && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y python3.8-venv python3-pip python3-setuptools python3.8-dev python3-opencv && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --upgrade pip

RUN ${LIB_FOLDER}/scripts/setup.sh

USER ${USER_NAME}
