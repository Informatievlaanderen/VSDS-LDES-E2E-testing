#!/bin/bash
clear

# send members
curl -X POST "http://localhost:8080/observations" -H "content-type: text/turtle" --data-binary @./data/members.ttl

# get page (as N-triples) -- wait until page fragmented
COUNT=0 && while [ "$COUNT" -lt "99" ] ; do sleep 3; COUNT=$(curl -s -H "accept: application/n-triples" "http://localhost:8080/observations/by-page?pageNumber=1" --output page.nt && cat page.nt | wc -l); echo "count: $COUNT" ; done
cat page.nt

# check that all subjects are named nodes (and as such no blank nodes exist)
NAMED_NODE_COUNT=$(cat page.nt | grep -e '^<http' | wc -l)
if [ "$NAMED_NODE_COUNT" -ne "$COUNT" ] 
  then echo "Triple count $COUNT does not match named node count $NAMED_NODE_COUNT, therefore blank nodes must exist" && exit -1
fi
echo "Triple count $COUNT matches named node count $NAMED_NODE_COUNT, therefore no blank nodes exist"

# check that all skolem objects are unique
SKOLEM_ID_COUNT=$(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' | wc -l)
UNIQUE_ID_COUNT=$(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' -o | uniq | wc -l)
if [ "$SKOLEM_ID_COUNT" -ne "$UNIQUE_ID_COUNT" ] 
  then echo "Skolem ID count $SKOLEM_ID_COUNT does not match unique count $UNIQUE_ID_COUNT, therefore some skolem IDs must be shared" && exit -1
fi
echo "Skolem ID count $SKOLEM_ID_COUNT matches unique count $UNIQUE_ID_COUNT, therefore no skolem IDs are shared"

# start the LDES client workflow
curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"

# query initial skolem IDs
COUNT=0 && while [ "$COUNT" -lt "1" ] ; do sleep 3; COUNT=$(curl -s -H "accept: application/sparql-results+json" http://localhost:7200/repositories/observations/size); echo "count: $COUNT" ; done
OBSERVATION1=$(export OBSERVATION_URI="<https://example.org/id/observation/1>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)
OBSERVATION2=$(export OBSERVATION_URI="<https://example.org/id/observation/2>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)

# send member 1 update
curl -X POST "http://localhost:8080/observations" -H "content-type: text/turtle" --data-binary @./data/members.update.ttl
echo ""

# query skolem IDs after update
COUNT=0 && while [ "$COUNT" -lt "131" ] ; do sleep 3; COUNT=$(curl -s -H "accept: application/sparql-results+json" http://localhost:7200/repositories/observations/size); echo "count: $COUNT" ; done
UPDATED1=$(export OBSERVATION_URI="<https://example.org/id/observation/1>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)
UPDATED2=$(export OBSERVATION_URI="<https://example.org/id/observation/2>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)

# expect all skolem IDs for observation 1 are different
readarray -t SKOLEM_IDS1 < <(echo $OBSERVATION1 | jq -c '.results.bindings[].bs.value' | sort)
readarray -t UPDATED_IDS1 < <(echo $UPDATED1 | jq -c '.results.bindings[].bs.value' | sort)
for ((i=0; i<${#UPDATED_IDS1[@]}; ++i)); do
  if [ "${SKOLEM_IDS1[i]}" == "${UPDATED_IDS1[i]}" ] 
    then echo "Original (${SKOLEM_IDS1[i]}) and updated (${UPDATED_IDS1[i]}) skolem ID match for member 1 (at index $i), therefore skolem IDs were not correctly deleted before updating the member" && exit -1
  fi
done
echo "All skolem IDs for member 1 are different"

# expect no skolem ID for observation 2 has changed
readarray -t SKOLEM_IDS2 < <(echo $OBSERVATION2 | jq -c '.results.bindings[].bs.value' | sort)
readarray -t UPDATED_IDS2 < <(echo $UPDATED2 | jq -c '.results.bindings[].bs.value' | sort)
for ((i=0; i<${#UPDATED_IDS2[@]}; ++i)); do
  if [ "${SKOLEM_IDS2[i]}" != "${UPDATED_IDS2[i]}" ] 
    then echo "Original (${SKOLEM_IDS2[i]}) and updated (${UPDATED_IDS2[i]}) skolem ID do not match for member 2 (at index $i), therefore skolem IDs were incorrectly deleted when updating the other member" && exit -1
  fi
done
echo "All skolem IDs for member 2 are identical"

echo "All checks passed."

