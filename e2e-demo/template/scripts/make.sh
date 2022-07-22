#!/usr/bin/env bash

# build
# clean
# debug: https://www.thorsten-hans.com/how-to-run-commands-in-stopped-docker-containers/

ENV_FILE=".env.local"
if [ ! -f ${ENV_FILE} ]; then
    ENV_FILE=".env"
fi
if [ ! -f ${ENV_FILE} ]; then
    echo "Please provide a valid environment file (cfr. README)"
    exit 1
fi
# echo "Using ENV file $ENV_FILE"
source ${ENV_FILE}


./scripts/wait-for-it.sh -h localhost -p 8443 -s -q

source ./scripts/nifi.sh
RESULT=$(create_and_start_process_group)
