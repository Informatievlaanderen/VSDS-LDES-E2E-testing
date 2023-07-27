#!/bin/bash
# allow full access to the EPSG
sudo mkdir -p -m 0777 ./data/epsg
# create archiving volume (if it does not yet exist) and allow full access to it
(docker volume inspect ldes-data-archive > /dev/null 2>&1) || (docker volume create ldes-data-archive > /dev/null)
sudo chmod 0777 $(docker volume inspect --format '{{.Mountpoint}}' ldes-data-archive)
# additionally allow full access to test 006 node-red folder
sudo chmod 0777 ./tests/006.server-substring-fragment-ldes/data/node-red
