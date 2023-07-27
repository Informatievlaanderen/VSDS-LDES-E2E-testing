#!/bin/bash

# allow full access to the EPSG
mkdir -p -m 0777 ./data/epsg

# create archiving folders and set access rights
mkdir -p ./data/archive
mkdir -p -m 0777 ./data/archive/ldio
mkdir -p -m 0777 ./data/archive/nifi

# additionally allow full access to test 006 node-red folder
chmod 0777 ./tests/006.server-substring-fragment-ldes/data/node-red
