#!/bin/bash

# allow full access to the EPSG
sudo mkdir -p -m 0777 ./data/epsg

# create archiving volume (if it does not yet exist) and allow full access to it
sudo mkdir -p -m 0777 ./data/archive

# additionally allow full access to test 006 node-red folder
sudo chmod 0777 ./tests/006.server-substring-fragment-ldes/data/node-red
