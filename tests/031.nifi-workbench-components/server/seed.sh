#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
export LDES_PATH=$SCRIPT_PATH/ldes
export LDES_SERVER_ADMIN_BASE="${LDES_SERVER_ADMIN_BASE:-http://localhost:8080}"

curl --fail -X POST "$LDES_SERVER_ADMIN_BASE/admin/api/v1/eventstreams" -H "Content-Type: text/turtle" -d "@$LDES_PATH/observations.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST "$LDES_SERVER_ADMIN_BASE/admin/api/v1/eventstreams/observations/views" -H "Content-Type: text/turtle" -d "@$LDES_PATH/observations-by-page.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
