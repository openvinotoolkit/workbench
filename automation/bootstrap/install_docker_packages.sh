set -e
printf "\n Installing Docker \n\n"

if [[ "$OSTYPE" == "linux-gnu" ]]; then

  sudo -E apt-get update

  sudo -E apt-get install -y \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg \
      lsb-release

  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

  echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo -E apt-get update

  sudo -E apt-get install -y docker-ce docker-ce-cli containerd.io

  sudo groupadd -f docker

  sudo usermod -aG docker $USER

  printf "\n Installing Docker Compose \n\n"

  sudo -E curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

  sudo chmod +x /usr/local/bin/docker-compose

  sudo -E curl \
  -L https://raw.githubusercontent.com/docker/compose/1.29.2/contrib/completion/bash/docker-compose \
  -o /etc/bash_completion.d/docker-compose

  printf "\n YOU MUST LOG OUT AND LOG IN AGAIN\n\n"

elif [[ "$OSTYPE" == "darwin"* ]]; then
   DOCKER_DMG_LINK="https://desktop.docker.com/mac/main/amd64/Docker.dmg?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-mac-amd64"
   DOCKER_DMG_PATH=~/Downloads/Docker.dmg
   curl -o ${DOCKER_DMG_PATH} -k ${DOCKER_DMG_LINK}
   hdiutil attach "${DOCKER_DMG_PATH}"
   cd /Volumes/Docker
   open -g -W Docker.app
   sudo spctl --master-disable
fi
