#/bin/bash
set -e

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.38.0/install.sh | bash


export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

pushd ${OPENVINO_WORKBENCH_ROOT}/client
    nvm install 14
    nvm use --delete-prefix v14 --silent
    npm ci
    npm run init-netron
popd
