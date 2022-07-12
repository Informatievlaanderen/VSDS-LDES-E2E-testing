#!/usr/bin/env bash

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENV_FILE=".env.local"
if [ ! -f ${ENV_FILE} ]; then
    ENV_FILE=.env
fi
if [ ! -f ${ENV_FILE} ]; then
    echo "Please provide a valid environment file (cfr. README)"
    exit 1
fi
echo "Using ENV file $ENV_FILE"

function prepare_environment() {
    create_directory ${NIFI_MOUNT_DIR}/logs
    create_directory ${NIFI_MOUNT_DIR}/conf
    create_directory ${NIFI_MOUNT_DIR}/flowfile_repository
}

function docker_compose() {
    COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 \
    NIFI_BUILD_DIR="./`basename $WORK_DIR`/`basename $NIFI_BUILD_DIR`" \
    NIFI_MOUNT_DIR="`realpath $WORK_DIR/$NIFI_MOUNT_DIR`" \
    docker-compose --env-file ${ENV_FILE} -f ${__dir}/../docker-compose.yml $@
}
