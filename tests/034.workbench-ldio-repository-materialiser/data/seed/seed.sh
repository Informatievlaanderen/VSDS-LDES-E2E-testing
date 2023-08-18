#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl -X PUT 'http://localhost:8080/rdf4j-server/repositories/test' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/config.ttl"
code=$?
if [ $code != 0 ]
    then exit $code
fi