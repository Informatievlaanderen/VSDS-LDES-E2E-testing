#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
export LDES_PATH=$SCRIPT_PATH/ldes
export DATA_PATH=$SCRIPT_PATH/members

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d "@$LDES_PATH/ldes.ttl"
code=$?
if [ $code != 0 ]
    then exit $code
fi

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views' -H 'Content-Type: text/turtle' -d "@$LDES_PATH/view.ttl"
code=$?
if [ $code != 0 ]
    then exit $code
fi
i=0

while [ $i -lt 5 ];
do
    curl --fail -X POST 'http://localhost:8080/mobility-hindrances' -H 'Content-Type: text/turtle' -d "@$DATA_PATH/member$i.ttl"
    code=$?
    i=$((i+1))
    if [ $code != 0 ]
        then exit $code
    fi
done


