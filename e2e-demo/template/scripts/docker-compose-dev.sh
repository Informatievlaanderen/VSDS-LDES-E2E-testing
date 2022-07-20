#!/usr/bin/env bash

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Creating the directories here to ensure local user ownership
if [ ! -d nifi ]; then
    mkdir -p nifi/logs
    mkdir -p nifi/conf
    mkdir -p nifi/flowfile_repository
fi

ENV_FILE=".env.local"
if [ ! -f ${ENV_FILE} ]; then
    ENV_FILE=.env
fi
if [ ! -f ${ENV_FILE} ]; then
    echo "Please provide a valid environment file (cfr. README)"
    exit 1
fi
echo "Using ENV file $ENV_FILE"

COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose --env-file ${ENV_FILE} -f ${__dir}/../docker-compose.yml $@
