#!/usr/bin/env bash

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Creating the directories here to ensure local user ownership
if [ ! -d nifi ]; then
    mkdir -p nifi/logs
    mkdir -p nifi/conf
    mkdir -p nifi/flowfile_repository
fi

COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --env-file ${ENV_FILE} -f ${__dir}/../docker-compose.yml $@
