#!/bin/bash
docker compose up -d --wait

# seed initial data and alias it
curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d '@simulator/alpha.ttl'
curl -X POST "http://localhost:9011/ldes?max-age=10" -H 'Content-Type: text/turtle' -d '@simulator/gamma.ttl'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@simulator/create-alias.json'
