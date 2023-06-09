# LDES Server Imposes An Ingest Order Per Collection
This scenario verifies that the LDES server imposes an order on ingested members per collection. It uses a [custom context](./docker-compose.yml) containing an LDES Server backed by a data store (mongodb).

For this test you can use the provided [dataset](./data).

## Scenario
```gherkin
Scenario: Server imposes an order on ingested members
  Given An LDES server with two collections: `mobility-hindrances` and `addresses`
  And I have ingested a series of tree members for both collections (10 mobility-hindrances and 5 addresses)
  When I check the database
  Then I see that for every collection a sequenceNumber is kept in the table `member_sequence`
  And Per collection every member has a sequenceNumber
  And For collection `mobility-hindrances` the members have numbers going from 1 to 10
  And For collection `addresses` the members have numbers going from 1 to 5
```

## Test Setup
Launch all systems:
```bash
docker compose up -d
```
Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Cancelled mongock lock daemon`:
```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
```
Press `CTRL-C` to stop following the log.

> **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh) to setup the LDES with its views:
```bash
chmod +x ./config/seed.sh
sh -c "cd ./config && ./seed.sh"
```

## Test execution
1. Ingest the data set:
    ```bash
    for member in {1..10}; do \
      curl -i -X POST \
        --url 'http://localhost:8080/mobility-hindrances' \
        -H "Content-Type: text/turtle" \
        --data-binary "@./data/mobility-hindrances$member.ttl"
    done
   
    for member in {1..5}; do \
      curl -i -X POST \
        --url 'http://localhost:8080/addresses' \
        -H "Content-Type: text/turtle" \
        --data-binary "@./data/addresses$member.ttl"
    done
    ```

2. Verify that the members exist in the LDES:
    ```bash
    curl http://localhost:8080/mobility-hindrances/by-page?pageNumber=1 -s | grep "terms:isVersionOf" | wc -l
    ```
    ```bash
    curl http://localhost:8080/addresses/by-page?pageNumber=1 -s | grep "terms:isVersionOf" | wc -l
    ```

   > **Note**: There should be 10 members in the `mobility-hindrances` collection and 5 in the `addresses` collection.


3. Verify that the collection `member_sequence` has two documents:
   ```bash
   curl http://localhost:9019/test/member_sequence?includeDocuments=true
   ```
   this returns something similar to:
   ```json
   {
     "count":2,
     "documents":[
       {
         "_id":"mobility-hindrances",
         "seq":10
       },
       {
         "_id":"addresses",
         "seq":5
       }
     ]
   }

   ```

4. Verify that each ingested member has a sequence number (please download and install [jq](https://stedolan.github.io/jq/download/) in needed):
   ```bash
   curl -s http://localhost:9019/test/ldesmember?includeDocuments=true | jq "[.documents[] | {collection: .collectionName, sequence: .sequenceNr}]"
   ```
   this returns something similar to:
   ```json
   [
      {
         "collection": "mobility-hindrances",
         "sequence": 1
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 2
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 3
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 4
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 5
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 6
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 7
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 8
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 9
      },
      {
         "collection": "mobility-hindrances",
         "sequence": 10
      },
      {
         "collection": "addresses",
         "sequence": 1
      },
      {
         "collection": "addresses",
         "sequence": 2
      },
      {
         "collection": "addresses",
         "sequence": 3
      },
      {
         "collection": "addresses",
         "sequence": 4
      },
      {
         "collection": "addresses",
         "sequence": 5
      }
   ]
   ```

## Test teardown
Stop data generator and new server, and bring all systems down:
```bash
docker compose down
```
