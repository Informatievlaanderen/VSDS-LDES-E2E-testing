#!/bin/bash
clear

# start the test message generator
docker compose up test-message-generator -d

# check received at least 1 observarion in sink
COUNT=0 && while [ "$COUNT" -lt "1" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.observations.total'); echo "count: $COUNT" ; done

# check received at least 10 observarions in sink
COUNT=0 && while [ "$COUNT" -lt "10" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.observations.total'); echo "count: $COUNT" ; done

# check received at least 100 observarions in sink
COUNT=0 && while [ "$COUNT" -lt "100" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.observations.total'); echo "count: $COUNT" ; done
