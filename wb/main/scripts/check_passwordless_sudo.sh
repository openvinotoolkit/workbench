#!/bin/bash

# execute true command with non interactive sudo
# will return 0 if passwordless sudo enabled
# 1 if command failed - no passwordless sudo enabled
sudo -n true

if [[ $? -eq 0 ]]; then
    exit 0
fi

exit 1
