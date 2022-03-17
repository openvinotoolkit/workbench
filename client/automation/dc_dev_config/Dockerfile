FROM library/node:10.18.1-buster

ENV REQUIREMENTS=/requirements
ENV PROJECT_ROOT=/client

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3-pip && \
    rm -rf /var/lib/apt/lists/*

COPY ./automation/requirements_dev.txt ${REQUIREMENTS}/requirements_dev.txt
RUN python3 -m pip install --no-cache-dir -r ${REQUIREMENTS}/requirements_dev.txt

COPY ./package.json ${PROJECT_ROOT}/package.json
COPY ./package-lock.json ${PROJECT_ROOT}/package-lock.json

WORKDIR ${PROJECT_ROOT}
RUN npm install

COPY . ${PROJECT_ROOT}
RUN npm run init-netron && npm run build

COPY ./automation/dc_dev_config/entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]
