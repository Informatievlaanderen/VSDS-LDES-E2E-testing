#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/device-models.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/device-models/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/device-models.paged.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/devices.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/devices/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/devices.paged.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/water-quality-observations.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/water-quality-observations/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/water-quality-observations.paged.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
