#!/bin/bash
SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
LDES_PATH=$SCRIPT_PATH/ldes
LDES_SERVER_ADMIN_BASE="${LDES_SERVER_ADMIN_BASE:-http://localhost:8080}"

curl --fail -X POST "$LDES_SERVER_ADMIN_BASE/admin/api/v1/eventstreams/test/views" -H "Content-Type: text/turtle" -d "@$LDES_PATH/test.time-based.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
