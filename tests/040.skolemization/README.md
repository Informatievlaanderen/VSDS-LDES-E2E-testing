# Skolemization
This tests verifies that when a LDES is setup to replace blank nodes with a pre-configured, well-known named node syntax (skolemization) that all members are output using this skolemized format. No blank nodes should exist in the tree members and all former blank nodes should be replaced by a unique skolem ID and consequently no former blank node is shared.

## Setup
To run all systems (execute in a bash shell):
```bash
clear
docker compose up -d --wait
sh ./server/seed.sh
```

## Run Test
We ingest two members and expect the contained blank nodes to be replace by our pre-configured domain (`http://schema.org`) followed by the standard skolem format `/.well-known/genid/{guid}` where the `{guid}` is a randomly created unique ID.

1. To send members containing blank nodes (which are skolemized by the server on reception):
```bash
curl -X POST "http://localhost:8080/observations" -H "content-type: text/turtle" --data-binary @./data/members.ttl
```

2. To retrieve the fragment (as N-triples for easier verification):
```bash
curl -s -H "accept: application/n-triples" "http://localhost:8080/observations/by-page?pageNumber=1" --output page.nt
```

3. To check that all subjects are named nodes (and therefore no blank nodes exist):
```bash
echo "Triple count: $(cat page.nt | wc -l), named nodes : $(cat page.nt | grep -e '^<http' | wc -l)"
```
> **Note** that these counts should match.

3. To check that all skolem objects are unique:
```bash
echo "Skolem ID count: $(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' | wc -l), unique skolems : $(cat page.nt | grep -e '<http://schema.org/.well-known/genid/[^>][^>]*> [.]$' -o | uniq | wc -l)"
```
> **Note** that these counts should match.

## Teardown
To stop all systems and cleanup:
```bash
docker compose down
rm page.nt
```
