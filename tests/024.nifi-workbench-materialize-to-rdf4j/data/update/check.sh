#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl -X POST 'http://localhost:8080/rdf4j-server/repositories/test' -H 'Content-Type: application/sparql-query' -d "@$SCRIPT_PATH/query.rq"
code=$?
if [ $code != 0 ]
    then exit $code
fi