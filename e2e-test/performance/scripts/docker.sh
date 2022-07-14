#!/usr/bin/env bash

function docker_clean() {
    docker rm -f $NIFI_DOCKER_CONTAINER_NAME &>/dev/null || true
    docker rm -f $SERVER_SIMULATOR_DOCKER_CONTAINER_NAME &>/dev/null || true
    docker rm -f $CLIENT_SINK_DOCKER_CONTAINER_NAME &>/dev/null || true

    docker image rm -f $NIFI_DOCKER_IMAGE_NAME &>/dev/null || true
    # docker image rm -f $NIFI_STAGE_MAVEN &>/dev/null || true
    # docker image rm -f $NIFI_STAGE_NIFI &>/dev/null || true
    # docker image rm -f $NIFI_STAGE_MAVEN 
    # docker image rm -f $NIFI_STAGE_NIFI 
    docker image rm -f $SERVER_SIMULATOR_DOCKER_IMAGE_NAME &>/dev/null || true
    docker image rm -f $CLIENT_SINK_DOCKER_IMAGE_NAME &>/dev/null || true

    docker system prune -f
    docker builder prune -f

    remove_directory .
    create_work_dir
}

function docker_build() {
    source ./scripts/docker-compose-dev.sh
    prepare_environment $WORK_DIR
    docker_compose build --no-cache
}

function docker_run() {
    source ./scripts/docker-compose-dev.sh
    docker_compose up
}
