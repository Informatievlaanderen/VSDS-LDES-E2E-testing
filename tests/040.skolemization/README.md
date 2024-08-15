# Skolemization
This tests verifies that when a LDES is setup to replace blank nodes with a pre-configured, well-known named node syntax (skolemization) that all members are output using this skolemized format. No blank nodes should exist in the tree members and all former blank nodes should be replaced by a unique skolem ID and consequently no former blank node is shared.

## Setup
To run all systems (execute in a bash shell):
```bash
clear
sh ./setup.sh
```

## Run Test
We ingest two members and expect the contained blank nodes to be replace by our pre-configured domain (`http://schema.org`) followed by the standard skolem format `/.well-known/genid/{guid}` where the `{guid}` is a randomly created unique ID. After that we materialize the members into a graph database and verify that after sending an update of the first member all original skolem IDs are replaced for the updated member while the skolem IDs of the other member stay the same (as no update was sent for that member).

1. To send members containing blank nodes (which are skolemized by the server on reception):
```bash
curl -X POST "http://${HOSTNAME}:8080/observations" -H "content-type: text/turtle" --data-binary @./data/members.ttl
```

2. To retrieve the fragment (as N-triples for easier verification):
```bash
curl -s -H "accept: application/n-triples" "http://${HOSTNAME}:8080/observations/by-page?pageNumber=1" --output page.nt
```

3. To check that all subjects are named nodes (and therefore no blank nodes exist):
```bash
echo "Triple count: $(cat page.nt | wc -l), named nodes : $(cat page.nt | grep -e '^<http' | wc -l)"
```
> **Note** that these counts should match (and not be zero, if so, fetch the fragment again using the previous step).

4. To check that all skolem objects are unique:
```bash
echo "Skolem ID count: $(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' | wc -l), unique skolems : $(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' -o | uniq | wc -l)"
```
> **Note** that these counts should match.

5. To start the LDES client workflow, reading the members from the server and materializing them to a graph database:
```bash
curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"
```

6. To query the initial skolem IDs for comparing them later (after all data is received):
```bash
COUNT=0 && while [ "$COUNT" -lt "1" ] ; do sleep 3; COUNT=$(curl -s -H "accept: application/sparql-results+json" http://localhost:7200/repositories/observations/size); echo "count: $COUNT" ; done
OBSERVATION1=$(export OBSERVATION_URI="<https://example.org/id/observation/1>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)
OBSERVATION2=$(export OBSERVATION_URI="<https://example.org/id/observation/2>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)
echo $OBSERVATION1
echo $OBSERVATION2
```

7. To send the update for the first member:
```bash
curl -X POST "http://localhost:8080/observations" -H "content-type: text/turtle" --data-binary @./data/members.update.ttl
```

8. To query the updated skolem IDs for comparison:
```bash
COUNT=0 && while [ "$COUNT" -lt "131" ] ; do sleep 3; COUNT=$(curl -s -H "accept: application/sparql-results+json" http://localhost:7200/repositories/observations/size); echo "count: $COUNT" ; done
UPDATED1=$(export OBSERVATION_URI="<https://example.org/id/observation/1>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)
UPDATED2=$(export OBSERVATION_URI="<https://example.org/id/observation/2>" && envsubst < ./graphdb/query.rq | curl -s -X POST -H "Content-Type: application/sparql-query" -H "accept: application/sparql-results+json" "http://localhost:7200/repositories/observations" -d @-)
```

9. Verify that all skolem IDs for observation 1 are different:
```bash
readarray -t SKOLEM_IDS1 < <(echo $OBSERVATION1 | jq -c '.results.bindings[].bs.value' | sort)
readarray -t UPDATED_IDS1 < <(echo $UPDATED1 | jq -c '.results.bindings[].bs.value' | sort)
for ((i=0; i<${#UPDATED_IDS1[@]}; ++i)); do if [ "${SKOLEM_IDS1[i]}" = "${UPDATED_IDS1[i]}" ] ; then echo "Original (${SKOLEM_IDS1[i]}) and updated (${UPDATED_IDS1[i]}) skolem ID match for member 1 (at index $i), therefore skolem IDs were not correctly delete before updating the member" ; fi ; done
```
> **Note** that the updated skolem IDs should be different, if not, re-query the graph database in the previous step to ensure the update is received.

10. Verify no skolem ID for observation 2 has changed:
```bash
readarray -t SKOLEM_IDS2 < <(echo $OBSERVATION2 | jq -c '.results.bindings[].bs.value' | sort)
readarray -t UPDATED_IDS2 < <(echo $UPDATED2 | jq -c '.results.bindings[].bs.value' | sort)
for ((i=0; i<${#UPDATED_IDS2[@]}; ++i)); do if [ "${SKOLEM_IDS2[i]}" != "${UPDATED_IDS2[i]}" ] ; then echo "Original (${SKOLEM_IDS2[i]}) and updated (${UPDATED_IDS2[i]}) skolem ID do not match for member 2 (at index $i), therefore skolem IDs were incorrectly deleted when updating the other member" ; fi ; done
```

## Teardown
To stop all systems and cleanup:
```bash
sh ./teardown.sh
```
