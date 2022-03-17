FROM {OPENVINO_DEV}

ENV REQUIREMENTS=/requirements
ENV PYTHON=/usr/bin/python3.6

USER root

# /etc/protocols is broken in this image for some reason.
RUN apt-get update && \
    apt-get install -y netbase && \
    rm -rf /var/lib/apt/lists/*

COPY ./requirements/requirements.txt                               ${REQUIREMENTS}/requirements.txt
COPY ./requirements/requirements_dev.txt                           ${REQUIREMENTS}/requirements_dev.txt
COPY ./model_analyzer/requirements.txt                             ${REQUIREMENTS}/requirements_model_analyzer.txt
COPY ./model_analyzer/requirements_dev.txt                         ${REQUIREMENTS}/requirements_model_analyzer_dev.txt

RUN ${PYTHON} -m pip install --no-cache-dir -r ${REQUIREMENTS}/requirements.txt && \
    ${PYTHON} -m pip install --no-cache-dir -r ${REQUIREMENTS}/requirements_dev.txt && \
    ${PYTHON} -m pip install --no-cache-dir -r ${REQUIREMENTS}/requirements_model_analyzer.txt && \
    ${PYTHON} -m pip install --no-cache-dir -r ${REQUIREMENTS}/requirements_model_analyzer_dev.txt

COPY ./docker/dc_dev_config/server/entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]
