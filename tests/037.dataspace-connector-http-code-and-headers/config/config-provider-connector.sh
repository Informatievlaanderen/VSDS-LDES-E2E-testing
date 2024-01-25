#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")

#create dataplane
curl --fail -H 'Content-Type: application/json' \
     -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "http-pull-provider-dataplane",
           "url": "http://provider-connector:19192/control/transfer",
           "allowedSourceTypes": [ "HttpData" ],
           "allowedDestTypes": [ "HttpProxy", "HttpData" ],
           "properties": {
             "https://w3id.org/edc/v0.0.1/ns/publicApiUrl": "http://localhost:19291/public/"
           }
         }' \
     -X POST "http://localhost:19193/management/v2/dataplanes"
code=$?
if [ $code != 0 ]
    then exit $code
fi

#create asset
curl --fail -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "devices",
              "properties": {
              "name": "device models",
              "contenttype": "application/n-quads"
           },
           "dataAddress": {
             "type": "HttpData",
             "name": "Test asset",
             "baseUrl": "http://ldes-server:8081/devices",
             "proxyPath": "true",
             "proxyQueryParams": "true",
             "contenttype": "application/n-quads",
             "header:Accept": "application/n-quads"
           }
         }' -H 'content-type: application/json' http://localhost:19193/management/v3/assets
code=$?
if [ $code != 0 ]
    then exit $code
fi

#create policy
curl --fail -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/",
             "odrl": "http://www.w3.org/ns/odrl/2/"
           },
           "@id": "aPolicy",
           "policy": {
             "@type": "set",
             "odrl:permission": [],
             "odrl:prohibition": [],
             "odrl:obligation": []
           }
         }' -H 'content-type: application/json' http://localhost:19193/management/v2/policydefinitions
code=$?
if [ $code != 0 ]
    then exit $code
fi

#create contract
curl --fail -d '{
           "@context": {
             "edc": "https://w3id.org/edc/v0.0.1/ns/"
           },
           "@id": "1",
           "accessPolicyId": "aPolicy",
           "contractPolicyId": "aPolicy",
           "assetsSelector": []
         }' -H 'content-type: application/json' http://localhost:19193/management/v2/contractdefinitions
code=$?
if [ $code != 0 ]
    then exit $code
fi