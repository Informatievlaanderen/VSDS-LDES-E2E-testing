#!/bin/bash
docker compose up -d --wait

# seed initial data and alias it
curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d "@./../../data/parkAndRide/by-page.ttl"
curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d '@simulator/alfa.ttl'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d '@simulator/beta.ttl'
curl -X POST "http://localhost:9011/ldes?max-age=10" -H 'Content-Type: text/turtle' -d '@simulator/gamma.ttl'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@simulator/create-alias.json'

# start the LDES client workflow
curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"

# check received count in sink
COUNT=0 && while [ "$COUNT" -ne "501" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done

# TODO: check last fragment re-requested and count does not increase?
