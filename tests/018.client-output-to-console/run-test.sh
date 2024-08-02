#!/bin/bash
clear

# start the LDES client workflow
curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"

# check received count in the console
COUNT=0 && while [ "$COUNT" -ne "1" ] ; do sleep 3; COUNT=$(docker logs $(docker ps -q --filter "name=ldio-workbench$") | grep "http://purl.org/dc/terms/isVersionOf" | wc -l) ; echo "count: $COUNT" ; done

# send data set update
curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d '@simulator/delta.ttl'

# check received count in the console
COUNT=0 && while [ "$COUNT" -ne "50" ] ; do sleep 3; COUNT=$(docker logs $(docker ps -q --filter "name=ldio-workbench$") | grep "http://purl.org/dc/terms/isVersionOf" | wc -l) ; echo "count: $COUNT" ; done
