#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
export LDES_PATH=$SCRIPT_PATH/ldes

curl --fail -X POST 'http://localhost:8082/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$LDES_PATH/devices.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8082/admin/api/v1/eventstreams/devices/views' -H 'Content-Type: text/turtle' -d "@$LDES_PATH/devices.paged.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
