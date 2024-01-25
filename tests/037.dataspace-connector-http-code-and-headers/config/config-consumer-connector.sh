#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

curl --fail -H 'Content-Type: application/json' \
     -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "http-pull-consumer-dataplane",
           "url": "http://consumer-connector:29192/control/transfer",
           "allowedSourceTypes": [ "HttpData" ],
           "allowedDestTypes": [ "HttpProxy", "HttpData" ],
           "properties": {
             "https://w3id.org/edc/v0.0.1/ns/publicApiUrl/publicApiUrl": "http://localhost:29291/public/"
            }
         }' \
             -X POST "http://localhost:29193/management/v2/dataplanes"
code=$?
if [ $code != 0 ]
    then exit $code
fi