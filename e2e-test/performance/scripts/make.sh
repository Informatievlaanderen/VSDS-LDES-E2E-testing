#!/usr/bin/env bash

# build
# clean
# debug: https://www.thorsten-hans.com/how-to-run-commands-in-stopped-docker-containers/

# SHORT_OPT=c,b,h
# LONG_OPT=clean,build,help
# OPTIONS=$(getopt --alternative --name --options $SHORT_OPT --longoptions $LONG_OPT -- "$@")
# echo $OPTIONS

function show_help() {
    echo "help"
}

# script dir
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENV_FILE=".env.local"
if [ ! -f ${ENV_FILE} ]; then
    ENV_FILE=.env
fi
if [ ! -f ${ENV_FILE} ]; then
    echo "Please provide a valid environment file (cfr. README)"
    exit 1
fi
echo "Using ENV file `realpath $ENV_FILE`"
source $ENV_FILE

WORK_DIR=`realpath ./work`
function create_work_dir() {
    if [ ! -d "$WORK_DIR" ]; then
        mkdir -p $WORK_DIR
    fi
}

function create_directory() {
    DIRECTORY=$1
    
    # Creating the directories here to ensure local user ownership
    if [ ! -d ${WORK_DIR}/${DIRECTORY} ]; then
        mkdir -p ${WORK_DIR}/${DIRECTORY}
    fi
}

function remove_directory() {
    DIRECTORY=$1
    CURRENT_DIR=`pwd`

    # Removing work dir ?
    if [ -z "$DIRECTORY" ] || [ "$DIRECTORY" == "." ]; then
        if [ -d "$WORK_DIR" ]; then
            cd $WORK_DIR
            cd ..
            rm -rf $WORK_DIR
        fi
    else
        cd $WORK_DIR
        rm -rf "$1"
    fi

    cd $CURRENT_DIR
}

function setup_nifi() {
    git-clone $NIFI_REPO $NIFI_REPO_NAME $WORK_DIR
}

function docker_clean() {
    docker rm -f $NIFI_DOCKER_CONTAINER_NAME &>/dev/null || true
    docker rm -f $SERVER_SIMULATOR_DOCKER_CONTAINER_NAME &>/dev/null || true
    docker rm -f $CLIENT_SINK_DOCKER_CONTAINER_NAME &>/dev/null || true

    docker image rm -f $NIFI_DOCKER_IMAGE_NAME &>/dev/null || true
    # docker image rm -f $NIFI_STAGE_MAVEN &>/dev/null || true
    # docker image rm -f $NIFI_STAGE_NIFI &>/dev/null || true
    docker image rm -f $NIFI_STAGE_MAVEN 
    docker image rm -f $NIFI_STAGE_NIFI 
    docker image rm -f $SERVER_SIMULATOR_DOCKER_IMAGE_NAME &>/dev/null || true
    docker image rm -f $CLIENT_SINK_DOCKER_IMAGE_NAME &>/dev/null || true

    docker builder prune -f

    remove_directory .
    create_work_dir
}

function docker_build() {
    source ./scripts/git.sh
    setup_nifi

    source ./scripts/docker-compose-dev.sh
    prepare_environment $WORK_DIR
    docker_compose build --no-cache
}

function docker_run() {
    source ./scripts/docker-compose-dev.sh
    docker_compose up --detach

    ./scripts/wait-for-it.sh -h localhost -p 8443 -s -q

    source ./scripts/nifi.sh
    RESULT=$(create_and_start_process_group)
}

# Only longoptions for getopt in GNU, so following this:
# http://mywiki.wooledge.org/BashFAQ/035
CLEAN_ENVIRONMENT=1
BUILD_ENVIRONMENT=1
RUN_ENVIRONMENT=1
while :; do
    case $1 in
        help|-h|-\?|--help)
            show_help
            exit
            ;;
        clean|-c|--clean)
            CLEAN_ENVIRONMENT=0
            ;;
        build|-b|--build)
            BUILD_ENVIRONMENT=0
            ;;
        run|-r|--run)
            RUN_ENVIRONMENT=0
            ;;
        *)
            break
            ;;
    esac

    shift
done

if [ "$CLEAN_ENVIRONMENT" -eq "0" ]; then
    docker_clean
fi

if [ "$BUILD_ENVIRONMENT" -eq "0" ]; then
    docker_build
fi

if [ "$RUN_ENVIRONMENT" -eq "0" ]; then
    docker_run
fi