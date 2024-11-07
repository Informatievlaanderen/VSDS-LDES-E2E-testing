#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

for i in $(seq 1 5);
do
    curl -X POST 'http://localhost:8080/http-sparql-out-pipeline' -H 'Content-Type: application/n-quads' -d "@$SCRIPT_PATH/$i.nq"
    code=$?
    if [ $code != 0 ]
        then exit $code
    fi
done

