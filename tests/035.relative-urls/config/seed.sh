#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl --fail -X POST 'http://localhost:9011/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/ldes.ttl"
code=$?
if [ $code != 0 ]
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/connections/views' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/view.ttl"
code=$?
if [ $code != 0 ]
    then exit $code
fi

while (i < 11) {
    curl --fail -X POST 'http://localhost:8080/connections' -H 'Content-Type: text/turtle' -d "@$SCRIPT_PATH/member.ttl"
    code=$?
    if [ $code != 0 ]
        then exit $code
    fi
  }


