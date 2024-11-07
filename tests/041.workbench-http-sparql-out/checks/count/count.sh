#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl -X POST 'http://localhost:8890/sparql' -H 'Content-Type: application/sparql-query' -H 'Accept: text/csv' -d "@$SCRIPT_PATH/query.rq"
code=$?
if [ $code != 0 ]
    then exit $code
fi