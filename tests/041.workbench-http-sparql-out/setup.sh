#!/bin/bash

# Start systems
docker compose up -d --wait
docker compose up -d --wait ldio-workbench

# Wait for workbench to be fully up and running
while ! docker logs "$(docker ps -q -f "name=ldio-workbench$")" | grep 'Started Application in' ; do sleep 1; done

