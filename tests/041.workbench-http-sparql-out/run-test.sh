#!/bin/bash
clear

# send 5 members to the workbench
sh ./data/add/post.sh

COUNT=$(curl -X POST 'http://localhost:8890/sparql' -s \
-H 'Content-Type: application/sparql-query' \
-H 'Accept: text/csv' \
-d "@checks/count/query.rq" \
--output "count.csv" && tail -n1 count.csv)

if [ "$COUNT" -ne 21 ]
  then echo "Expected to count 21 triples, but counted $COUNT triples" && exit -1
fi
echo "Triple store contains 21 triples, therefore all members are successfully sent to the triples store"

curl -X POST 'http://localhost:8890/sparql' -s \
-H 'Content-Type: application/sparql-query' \
-H 'Accept: text/csv' \
-d "@checks/name/query.rq" \
--output "name.csv"
TAYLOR_NAME_COUNT=$(grep -c "Taylor" name.csv)

if [ "$TAYLOR_NAME_COUNT" -ne 1 ]
  then echo "Taylor Kennedy should have the given name 'Taylor' exactly once, but counted $TAYLOR_NAME_COUNT times" && exit -1
fi
echo "Taylor Kennedy has the given name 'Taylor' exactly once"

# update the members

sh ./data/update/update.sh

# check if the members are updated
COUNT=$(curl -X POST 'http://localhost:8890/sparql' -s \
-H 'Content-Type: application/sparql-query' \
-H 'Accept: text/csv' \
-d "@checks/count/query.rq" \
--output "count.csv" && tail -n1 count.csv)

if [ "$COUNT" -ne 21 ]
  then echo "Expected to count still 21 triples, but counted now $COUNT triples" && exit -1
fi
echo "Triple store still contains 21 triples, therefore all members are successfully updated"

curl -X POST 'http://localhost:8890/sparql' -s \
-H 'Content-Type: application/sparql-query' \
-H 'Accept: text/csv' \
-d "@checks/name/query.rq" \
--output "name.csv"

CHANGED_NAME_COUNT=$(grep -c "CHANGED" name.csv)
if [ "$CHANGED_NAME_COUNT" -ne 1 ]
  then echo "Taylor Kennedy should have the given name 'CHANGED' exactly once, but counted $CHANGED_NAME_COUNT times" && exit -1
fi
echo "Taylor Kennedy has the given name 'CHANGED' exactly once"

TAYLOR_NAME_COUNT=$(grep -c "Taylor" name.csv)
if [ "$TAYLOR_NAME_COUNT" -ne 0 ]
  then echo "Taylor Kennedy should not have the given name 'Taylor', but counted $TAYLOR_NAME_COUNT times" && exit -1
fi
echo "Taylor Kennedy does not have the given name 'Taylor' anymore"