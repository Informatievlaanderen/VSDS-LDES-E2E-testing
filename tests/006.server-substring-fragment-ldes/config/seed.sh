#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/addresses.ttl"
if [ $? != 0 ]
    then exit $?
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/addresses/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/addresses.by-name.ttl"
if [ $? != 0 ]
    then exit $?
fi

curl -X DELETE 'http://localhost:8080/admin/api/v1/eventstreams/addresses/views/by-page'
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/addresses/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/addresses.by-page.ttl"
if [ $? != 0 ]
    then exit $?
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/addresses/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/addresses.by-location-and-page.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
