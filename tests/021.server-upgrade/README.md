# Upgrading an LDES Server
This test verifies the upgrade procedure for an LDES Server in a typical scenario with Nifi or the LDI-orchestrator.
We do not want to interrupt the inflow of data as some system (such as Orion) cannot buffer 
the messages, and consequently we would lose some during the upgrade process.

This test uses a docker environment containing a data generator simulating the system pushing data, 
a NiFi or LDI workbench, an LDES data store (mongoDB), an old LDES server and a new LDES server (both setup for timebased fragmentation).

The server upgrade will include changesets that alter the database schema. We will also verify that these changes have been implemented.

## Test setup
1. Launch all systems except for the new LDES server:
   ```bash
   alias jq=./node_modules/node-jq/bin/jq
   ```
   ```bash
   docker compose up -d
   ```
   Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Started Application in`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=old-ldes-server$")
    ```
   Press `CTRL-C` to stop following the log.

2. Start the workflow containing to ingest the members:
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```
   or:
    ```bash
    docker compose up nifi-workbench -d
    while ! curl -s -I "http://localhost:8000/nifi/"; do sleep 5; done
    ```
   > **Note**: for the [NiFi workbench](http://localhost:8000/nifi/) you also need to upload the [workflow](./nifi-workflow.json) and start it
   
3. Start the data generator pushing JSON-LD messages (based on a single message [template](./data/device.template.json)) to the http listener:
   ```bash
   docker compose up test-message-generator -d
   ```

4. Verify that members are available in LDES by following the link in the `tree:node`:
   ```bash
   curl -s http://localhost:8080/devices-paged | grep "tree:node"
   ```
   and data store member count increases (execute repeatedly until at least 11 members - will produce more than one fragment):
   ```bash
   curl http://localhost:9019/iow_devices/ingest_ldesmember
   ```

5. Verify that the ldesfragment collection is structured as expected:
   ```bash
   curl -s http://localhost:9019/iow_devices/fragmentation_fragment?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'
   ```
   This should return the following list of keys for the ldesfragment collection:
   ```json
   [
     "_class",
     "fragmentPairs",
     "immutable",
     "members",
     "relations",
     "root",
     "viewName"
   ]
   ```

6. Verify that the ldesmember collection is structured as expected:
   ```bash
   curl -s http://localhost:9019/iow_devices/ingest_ldesmember?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(.))'
   ```
   This should return the following list of keys for the ldesmember collection:
   ```json
   [
      "_class",
      "_id",
      "ldesMember"
   ]
   ```

7. Verify that the _id has no prefix
   ```bash
   curl -s http://localhost:9019/iow_devices/ingest_ldesmember?includeDocuments=true | jq '[.documents[1]._id | values]'
   ```
   The result should match the below pattern:
   ```json
   [
    "urn:ngsi-v2:cot-imec-be:Device:imec-iow-UR5gEycRuaafxnhvjd9jnU:{index}/{current-timestamp}"
   ]
   ```

8. Verify that the fields contain no indices except for the _id.
   ```bash
   curl -s http://localhost:9019/iow_devices/fragmentation_fragment?includeIndices=true | jq '[.indices[]]'
   ```
   The result should match the below pattern:
   ```json
   [
    "_id_"
   ]
   ```
   We do not pass the `auto-index-creation: true` property to the old server.
   For this reason, we do not expect any indices to be created, which allows manual management of the indices.

## Test execution
1. Pause the workbench output.

    ```bash
    curl -X POST "http://localhost:8081/admin/api/v1/pipeline/halt"
    ```
   or for nifi

   Stop http sender in workflow.

2. Ensure old server is done processing (i.e. data store member count does not change) and bring old server down (stop it, remove volumes and image without confirmation):
   ```bash
   curl http://localhost:9019/iow_devices/ingest_ldesmember
   ```
   ```bash
   docker compose rm --stop --force --volumes old-ldes-server
   ```

3. Launch new server, wait until database migrated and server started (i.e. check logs):
   ```bash
   docker compose up new-ldes-server -d
   docker logs --tail 1000 -f $(docker ps -q --filter "name=new-ldes-server$")
   ```
   > **Note**: the  database has been fully migrated when the log file contains `Cancelled mongock lock daemon` at or near the end (press `CTRL-C` to end following the log file).

4. Verify that the ldesfragment collection is structured as expected:
   ```bash
   curl -s http://localhost:9019/iow_devices/fragmentation_fragment?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(.))'
   ```
   This should return the following list of keys for the ldesfragment collection:
   ```json
   [
   "_class",
   "_id",
   "collectionName",
   "fragmentPairs",
   "immutable",
   "numberOfMembers",
   "parentId",
   "relations",
   "root",
   "viewName"
   ]
   ```

   > **Note**: Changeset-1 will add the `softDeleted`, `parentId` and `immutableTimestamp` values to the model and will replace the `members` array with a value indicating the amount of members in the fragment in `numberOfMembers`
   > **Note**: Changeset-3 will add the `collectionName`
   > **Note**: Changeset-6 will remove the `softDeleted` and `immutableTimestamp` values from the model

5. Verify that the ldesmember collection is structured as expected:
   ```bash
   curl -s http://localhost:9019/iow_devices/ingest_ldesmember?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(.))'
   ```
   This should return the following list of keys for the ldesmember collection:
   ```json
   [
   "_class",
   "_id",
   "collectionName",
   "model",
   "sequenceNr",
   "timestamp",
   "treeNodeReferences",
   "versionOf"
   ]
   ```
   > **Note**: Changeset-1 will rename `ldesmember` to `model` and add a list of tree:node references in `treeNodeReferences`
   > **Note**: Changeset-2 will extract the `versionOf` and `timestamp` fields from the model
   > **Note**: Changeset-3 will add the `collectionName` and `sequenceNr`
   > **Note**: Changeset-4 will add a prefix of the collectionName in front of the id

6. Verify that the _id has the collectionName as a prefix
   ```bash
   curl -s http://localhost:9019/iow_devices/ingest_ldesmember?includeDocuments=true | jq '[.documents[1]._id | values]'
   ```
   The result should match the below pattern:
   ```json
   [
    "devices/urn:ngsi-v2:cot-imec-be:Device:imec-iow-UR5gEycRuaafxnhvjd9jnU:{index}/{current-timestamp}"
   ]
   ```

7. Verify that the yaml config was successfully migrated to mongodb config
   ```bash
   curl -X 'GET' 'http://localhost:8080/admin/api/v1/eventstreams' -H 'accept: text/turtle'
   ```
   Should return
   ```text
   @prefix default-context: <https://uri.etsi.org/ngsi-ld/default-context/> .
   @prefix devices:         <http://localhost:8080/devices/> .
   @prefix devices-paged: <http://localhost:8080/devices/devices-paged/> .
   @prefix ldes:            <https://w3id.org/ldes#> .
   @prefix prov:            <http://www.w3.org/ns/prov#> .
   @prefix rdf:             <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
   @prefix shacl:           <http://www.w3.org/ns/shacl#> .
   @prefix terms:           <http://purl.org/dc/terms/> .
   @prefix tree:            <https://w3id.org/tree#> .
   
   devices-paged:description
           rdf:type                    tree:ViewDescription ;
           tree:fragmentationStrategy  ( [ rdf:type          tree:TimebasedFragmentation ;
                                           tree:memberLimit  "25"
                                         ]
                                       ) .
   
   <http://localhost:8080/devices>
           rdf:type            ldes:EventStream ;
           <http://example.org/memberType>
                   default-context:Device ;
           ldes:timestampPath  prov:generatedAtTime ;
           ldes:versionOfPath  terms:isVersionOf ;
           tree:shape          [ rdf:type  shacl:NodeShape ] ;
           tree:view           devices:devices-paged .
   
   devices:devices-paged
           rdf:type              tree:Node ;
           tree:viewDescription  devices-paged:description .
   ```

   > **Note**: Changeset-7 will create three new collections for this: `eventstreams`, `view` and `shacl_shape`

8. Verify that the fields contain the correct indices.
   The new server contains the property `auto-index-creation: true` which allows mongock to also create
   indices when adding new fields.

   ```bash
   curl -s http://localhost:9019/iow_devices/fragmentation_fragment?includeIndices=true | jq '[.indices[]]'
   ```
   The result should match the below pattern:
   ```json
   [
     "_id_",
     "root",
     "viewName",
     "immutable",
     "parentId",
     "collectionName"
   ]
   ```

   ```bash
   curl -s http://localhost:9019/iow_devices/ingest_ldesmember?includeIndices=true | jq '[.indices[]]'
   ```
   The result should match the below pattern:
   ```json
   [
     "_id_",
     "collectionName",
     "sequenceNr",
     "versionOf",
     "timestamp",
     "treeNodeReferences"
   ]
   ```

10. Verify that members are available in LDES and check member count in the last fragment:
    ```bash
    docker compose up ldes-list-fragments -d
    sleep 3 # ensure stream has been followed up to the last fragment
    export LAST_FRAGMENT=$(docker logs --tail 1 $(docker ps -q --filter "name=ldes-list-fragments$"))
    curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
    ```

11. Resume the workbench output.

     ```bash
     curl -X POST "http://localhost:8081/admin/api/v1/pipeline/resume"
     ```
    or for nifi

    Start http sender in workflow after redirecting the output to the new server.

12. Verify last fragment member count increases (max count in fragment is 25):
    ```bash
    curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
    ```

13. Verify data store member count increases (execute repeatedly):
    ```bash
    curl http://localhost:9019/iow_devices/ingest_ldesmember
    ```

## Test teardown
Stop data generator and new server, and bring all systems down:
```bash
docker compose rm -s -f -v new-ldes-server
docker compose rm -s -f -v ldes-list-fragments
docker compose rm -s -f -v test-message-generator
docker compose rm -s -f -v ldio-workbench
docker compose rm -s -f -v nifi-workbench
docker compose down
```
