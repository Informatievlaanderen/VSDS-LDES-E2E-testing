# Upgrading a LDES Server in a NiFi Workbench Scenario
This test verifies the upgrade procedure for a LDES Server in a typical scenario where we use a NiFi workbench based on NiFi and messages are being pushed to the workflow. We do not want to interrupt the inflow of data as some system (such as Orion) cannot buffer the messages and consequently we would loose some during the upgrade process.

This test uses a docker environment containing a data generator simulating the system pushing data, a NiFi workbench, a LDES data store (mongoDB), an old LDES server and a new LDES server (both setup for timebased fragmentation).

The server upgrade will include changesets that alter the database schema. We will also verify that these changes have been implemented.

The server upgrade will include changesets that alter the database schema. We will also verify that these changes have been implemented.

## Test setup
1. Launch all systems except for the new LDES server:
   ```bash
   alias jq=./node_modules/node-jq/bin/jq
   docker compose up -d
   ```
   Please ensure that the NiFi Workbench is started by executing the following command until it returns `HTTP/1.1 200 OK`:
   ```bash
   curl -I http://localhost:8000/nifi/
   ```
   or use this command until it exists with a HTTP code 200:
   ```bash
   while ! curl -s -I "http://localhost:8000/nifi/"; do sleep 5; done
   ```

2. Connect to [NiFi workbench](http://localhost:8000/nifi), upload and start [workflow](./nifi-workflow.json) (containing a http listener, a version creation component and a http sender).

3. Start the data generator pushing JSON-LD messages (based on a single message [template](./data/device.template.json)) to the http listener:
   ```bash
   docker compose up test-message-generator -d
   ```

4. Verify that members are available in LDES by following the link in the `tree:node`:
   ```bash
   curl -s http://localhost:8080/devices-by-time | grep "tree:node"
   ```
   and data store member count increases (execute repeatedly until at least 11 members - will produce more than one fragment):
   ```bash
   curl http://localhost:9019/iow_devices/ldesmember
   ```

5. Verify that the ldesfragment collection is structured as expected:
   ```bash
   curl -s http://localhost:9019/iow_devices/ldesfragment?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'
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
   curl -s http://localhost:9019/iow_devices/ldesmember?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'
   ```
   This should return the following list of keys for the ldesmember collection:
   ```json
   [
     "_class",
     "ldesMember"
   ]
   ```

## Test execution
1. Stop http sender in workflow.

2. Ensure old server is done processing (i.e. data store member count does not change) and bring old server down (stop it, remove volumes and image without confirmation):
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
   curl -s http://localhost:9019/iow_devices/ldesfragment?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'
   ```
   This should return the following list of keys for the ldesfragment collection:
   ```json
   [
   "_class",
   "collectionName",
   "fragmentPairs",
   "immutable",
   "immutableTimestamp",
   "numberOfMembers",
   "parentId",
   "relations",
   "root",
   "softDeleted",
   "viewName"
   ]
   ```
   > **Note**: the `immutableTimestamp` may not be in this list if no fragment is currently immutable

   > **Note**: Changeset-1 will add the `softDeleted`, `parentId` and `immutableTimestamp` values to the model and will replace the `members` array with a value indicating the amount of members in the fragment in `numberOfMembers`

5. Verify that the ldesmember collection is structured as expected:
   ```bash
   curl -s http://localhost:9019/iow_devices/ldesmember?includeDocuments=true | jq '[.documents[] | keys] | flatten | unique | map(select(. != "_id"))'
   ```
   This should return the following list of keys for the ldesmember collection:
   ```json
   [
   "_class",
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

6. Verify that members are available in LDES and check member count in the last fragment:
   ```bash
   docker compose up ldes-list-fragments -d
   sleep 3 # ensure stream has been followed up to the last fragment
   export LAST_FRAGMENT=$(docker logs --tail 1 $(docker ps -q --filter "name=ldes-list-fragments$"))
   curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
   ```

7. Start http sender in workflow after redirecting the output to the new server.

8. Verify last fragment member count increases:
   ```bash
   curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
   ```

9. Verify data store member count increases (execute repeatedly):
   ```bash
   curl http://localhost:9019/iow_devices/ldesmember
   ```

## Test teardown
Stop data generator and new server, and bring all systems down:
```bash
docker compose rm -s -f -v new-ldes-server
docker compose rm -s -f -v test-message-generator
docker compose down
```
