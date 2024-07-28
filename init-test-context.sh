#!/bin/bash

# allow full access to the EPSG
mkdir -p -m 0777 ./data/epsg

# create archiving folders and set access rights
mkdir -p ./data/archive
mkdir -p -m 0777 ./data/archive/ldio
mkdir -p -m 0777 ./data/archive/nifi

# TODO: retrieve latest NiFi components from Nexus (https://s01.oss.sonatype.org/#nexus-search;quick~be.vlaanderen.informatievlaanderen.ldes.ldi.nifi)
# download these to _nifi-workbench/nar-ext and set permissions to 0777
