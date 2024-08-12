#!/bin/bash
CWD=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
LOCALHOST=$(hostname)
export HOSTNAME=${HOSTNAME:-$LOCALHOST}
docker compose down
rm -f $CWD/page.nt
