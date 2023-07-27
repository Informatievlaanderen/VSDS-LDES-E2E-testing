#!/bin/bash

# allow full access to the EPSG
sudo mkdir -p -m 0777 ./data/epsg

# create archiving folders and set access rights
sudo mkdir -p ./data/archive
sudo mkdir -p -m 0777 ./data/archive/ldio
sudo mkdir -p -m 0777 ./data/archive/nifi

# additionally allow full access to test 006 node-red folder
sudo chmod 0777 ./tests/006.server-substring-fragment-ldes/data/node-red
