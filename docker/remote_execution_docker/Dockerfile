FROM ubuntu:18.04

# rewrite shell output
SHELL ["/bin/bash", "+x", "-c"]

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssh-server \
    ssh \
    python3 \
    python3-distutils \
    python3-apt \
    python3-dev \
    python3-pip \
    gcc \
    libgtk-3-0 \
    software-properties-common \
    ffmpeg \
    curl \
    sudo \
    udev \
    && rm -rf /var/lib/apt/lists/*

# The ffmpeg is for the remote calibration
# The wget is for the GPU drivers installation
# The udev and sudo are for Myriad drivers installation

# Upgrading pip
RUN pip3 install --upgrade pip

WORKDIR /

# Configuring SSH for root
COPY sshKeyContainer.pub /
RUN mkdir -p /root/.ssh && touch /root/.ssh/authorized_keys && \
    cat /sshKeyContainer.pub >> /root/.ssh/authorized_keys

# Preparing ssh
RUN mkdir /var/run/sshd && chmod 0755 /var/run/sshd

# Starting ssh server and making the container running forever
ENTRYPOINT /usr/sbin/sshd && tail -f /dev/null
