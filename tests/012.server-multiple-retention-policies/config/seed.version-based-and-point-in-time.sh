#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

expirationTime=$($SCRIPT_PATH/future-date.sh 60) 
view=$(cat $SCRIPT_PATH/mobility-hindrances.version-based-and-point-in-time.ttl | sed 's/CURRENTTIME/'"$expirationTime"'/')

curl --fail -X POST 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views' -H "Content-Type: text/turtle" --data-raw "$view" -i
code=$?
if [ $code != 0 ] 
    then exit $code
fi
