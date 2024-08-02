#!/bin/bash
CWD=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
LOCALHOST=$(hostname)
export HOSTNAME=${HOSTNAME:-$LOCALHOST}
docker compose rm -s -f -v test-message-generator
docker compose down
rm -rf $CWD/temp/*.nar
