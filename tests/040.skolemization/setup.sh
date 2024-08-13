#!/bin/bash
CWD=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

# launch all systems
LOCALHOST=$(hostname)
export LDES_SERVER_HOSTNAME=${HOSTNAME:-$LOCALHOST}
docker compose up -d --wait

# configure the server
sh $CWD/server/seed.sh
