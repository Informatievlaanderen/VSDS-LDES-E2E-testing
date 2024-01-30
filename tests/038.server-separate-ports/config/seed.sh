#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl --fail -X POST 'http://localhost:8089/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/ldes.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8089/admin/api/v1/eventstreams/mobility-hindrances/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/view.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
