#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl -X POST 'http://localhost:8082/pipeline' -H 'Content-Type: application/n-quads' -d "@$SCRIPT_PATH/1.nq"
code=$?
if [ $code != 0 ]
    then exit $code
fi

