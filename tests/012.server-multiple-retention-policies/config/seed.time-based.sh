#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/mobility-hindrances.time-based.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
