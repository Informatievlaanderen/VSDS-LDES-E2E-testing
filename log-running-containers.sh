#!/bin/bash
for id in $(./get-container-ids.sh); do ./format-container-log.sh $id ; done
