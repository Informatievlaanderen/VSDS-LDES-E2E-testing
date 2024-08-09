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

# check that all skolem objects are unique
SKOLEM_ID_COUNT=$(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' | wc -l)
UNIQUE_ID_COUNT=$(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' -o | uniq | wc -l)
if [ "$SKOLEM_ID_COUNT" -ne "$UNIQUE_ID_COUNT" ] 
  then echo "Skolem ID count $SKOLEM_ID_COUNT does not match unique count $UNIQUE_ID_COUNT, therefore some skolem IDs must be shared" && exit -1
fi

echo "All checks passed."
exit 0
