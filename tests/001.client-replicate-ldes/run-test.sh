#!/bin/bash
clear

# seed with partial dataset
for f in ../../data/parkAndRide/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: text/turtle" -d "@$f"; done
curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@./simulator/create-alias.json'

# start the LDES client workflow
curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"

# check received count in sink
COUNT=0 && while [ "$COUNT" -ne "1016" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total'); echo "count: $COUNT" ; done
