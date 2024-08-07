#!/bin/bash
mkdir ./workbench/state && chmod 0777 ./workbench/state
docker compose up -d --wait

# seed initial data and alias it
for f in ../../data/parkAndRide/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: text/turtle" -d "@$f"; done
curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@simulator/create-alias.json'
