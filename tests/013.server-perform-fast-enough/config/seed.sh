#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/connections.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

# curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/connections/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/connections.by-location-and-time.ttl"
# if [ $? != 0 ] 
#     then exit $? 
# fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/connections/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/connections.by-location.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/connections/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/connections.by-time.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/connections/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/connections.by-page.ttl"
code=$?
if [ $code != 0 ] 
    then exit $code
fi
