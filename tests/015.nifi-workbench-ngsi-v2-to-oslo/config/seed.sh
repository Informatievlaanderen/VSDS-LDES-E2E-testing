#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/device-models.ttl"
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/device-models/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/device-models.by-time.ttl"
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/devices.ttl"
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/devices/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/devices.by-time.ttl"
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/water-quality-observations.ttl"
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/water-quality-observations/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/water-quality-observations.by-time.ttl"
if [ $? != 0 ] 
    then exit $? 
fi
