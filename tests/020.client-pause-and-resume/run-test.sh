#!/bin/bash
clear

# start the LDES client workflow
curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"

# check received count in sink
COUNT=0 && while [ "$COUNT" -lt "250" ] ; do sleep 1; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done

# stop the workbench (simulating a crash or intended interruption)
docker compose stop ldio-workbench

# check that the message sink log file does not contain any warnings
WARNING_COUNT=$(docker logs $(docker ps -f "name=test-message-sink$" -q) | grep WARNING | wc -l)
if [ $WARNING_COUNT != 0 ] 
    then exit $WARNING_COUNT
fi
sleep 3

# re-start the workbench
docker compose start ldio-workbench

# wait until ready
STARTING=-1 && while [ "$STARTING" -ne 0 ] ; do sleep 1; curl -f -s http://localhost:8081/actuator/health; STARTING=$? ; done

# re-start the LDES client workflow
curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"

# wait until the LDES is fully replicated
COUNT=0 && while [ "$COUNT" -ne "1016" ] ; do sleep 1; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done

# check that the message sink received all members only once
DUPLICATE_COUNT=$(docker logs $(docker ps -f "name=test-message-sink$" -q) | grep 'overriding id' | wc -l)
if [ $DUPLICATE_COUNT != 0 ] 
    then exit $DUPLICATE_COUNT
fi
