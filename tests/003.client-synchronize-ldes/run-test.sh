#!/bin/bash
clear

# send data set update
curl -X POST "http://localhost:9011/ldes?max-age=10" -H 'Content-Type: text/turtle' -d '@simulator/delta.ttl'

# check received count in sink
COUNT=0 && while [ "$COUNT" -ne "550" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done

# send another data set update
curl -X POST "http://localhost:9011/ldes?max-age=10" -H 'Content-Type: text/turtle' -d '@simulator/epsilon.ttl'

# check received count in sink
COUNT=0 && while [ "$COUNT" -ne "617" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done
