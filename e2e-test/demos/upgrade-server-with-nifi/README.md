# Upgrading a LDES Server in a NiFi Workbench Scenario
This test verifies the upgrade procedure for a LDES Server in a typical scenario where we use a LDES workbench based on NiFi and messages are being pushed to the workflow. We do not want to interrupt the inflow of data as some system (such as Orion) cannot buffer the messages and consequently we would loose some during the upgrade process.

This test uses a docker environment containing a data generator simulating the system pushing data, a LDES workbench, a LDES data store (mongoDB), an old LDES server and a new LDES server (both setup for timebased fragmentation).

The server upgrade will include changesets that alter the database schema. We will also verify that these changes have been implemented.

## Test setup
1. Launch all systems except for the new LDES server:
   ```bash
   docker compose up -d
   ```

2. Connect to [NiFi workbench](http://localhost:8000/nifi), upload and start [workflow](./nifi-workflow.json) (containing a http listener, a version creation component and a http sender).

3. Start the data generator pushing JSON-LD messages (based on a single message [template](./data/device.template.json)) to the http listener:
   ```bash
   docker compose up json-data-generator -d
   ```

4. Verify that members are available in LDES:
   ```bash
   curl http://localhost:8080/devices-by-time
   ```
   and data store member count increases (execute repeatedly):
   ```bash
   curl http://localhost:9019/iow_devices/ldesmember
   ```

5. Verify that the ldesfragment collection is structured as expected:
   ```bash
   docker exec -it upgrade-server-using-nifi_ldes-mongodb mongosh iow_devices --eval '
     var map = function(){
       var keys = [];
       Object.keys(this).forEach(function(k){
         if(k != "_id"){
           keys.push(k);
         }
        })
        emit(this.type,{"keys":keys});
     };
     var reduce = function(key,values){
       var uniqueKeys = {};
       var result = [];
       values.forEach(function(value){
         value.keys.forEach(function(k){
           if(!uniqueKeys[k]){
             uniqueKeys[k] = 1;
             result.push(k);
           }
         });
       });
       return {"keys":result};
     };
     db.ldesfragment.mapReduce(map, reduce, {out:"ldesfragment_keys"});
     db.ldesfragment_keys.aggregate([{$project:{"_id": 0, "keys":"$value.keys"}}]);'
   ```
   This should return the following list of keys for the ldesfragment collection:
   ```json
   [
     {
       keys: [
         'root',
         'viewName',
         'fragmentPairs',
         'immutable',
         'relations',
         'members',
         '_class'
       ]
     }
   ]
   ```

6. Verify that the ldesmember collection is structured as expected:
   ```bash
   docker exec -it upgrade-server-using-nifi_ldes-mongodb mongosh iow_devices --eval '
     var map = function(){
       var keys = [];
       Object.keys(this).forEach(function(k){
         if(k != "_id"){
           keys.push(k);
         }
        })
        emit(this.type,{"keys":keys});
     };
     var reduce = function(key,values){
       var uniqueKeys = {};
       var result = [];
       values.forEach(function(value){
         value.keys.forEach(function(k){
           if(!uniqueKeys[k]){
             uniqueKeys[k] = 1;
             result.push(k);
           }
         });
       });
       return {"keys":result};
     };
     db.ldesmember.mapReduce(map, reduce, {out:"ldesmember_keys"});
     db.ldesmember_keys.aggregate([{$project:{"_id": 0, "keys":"$value.keys"}}]);'
   ```
   This should return the following list of keys for the ldesmember collection:
   ```json
   [
     {
       keys: [
         'ldesMember',
         '_class'
       ]
     } 
   ]
   ```

## Test execution
1. Stop http sender in workflow.

2. Ensure old server is done processing (i.e. data store member count does not change) and bring old server down (stop it, remove volumes and image without confirmation):
```bash
docker compose stop old-ldes-server
docker compose rm --force --volumes old-ldes-server
```

3. Launch new server, wait until database migrated and server started (i.e. check logs):
```bash
docker compose up new-ldes-server -d
docker logs --tail 1000 -f $(docker ps -q --filter "name=new-ldes-server$")
```
> **Note**: the  database has been fully migrated when the log file contains `Mongock has finished` at or near the end (press `CTRL-C` to end following the log file).

4. Verify that the ldesfragment collection is structured as expected:
   ```bash
   docker exec -it upgrade-server-using-nifi_ldes-mongodb mongosh iow_devices --eval '
     var map = function(){
       var keys = [];
       Object.keys(this).forEach(function(k){
         if(k != "_id"){
           keys.push(k);
         }
        })
        emit(this.type,{"keys":keys});
     };
     var reduce = function(key,values){
       var uniqueKeys = {};
       var result = [];
       values.forEach(function(value){
         value.keys.forEach(function(k){
           if(!uniqueKeys[k]){
             uniqueKeys[k] = 1;
             result.push(k);
           }
         });
       });
       return {"keys":result};
     };
     db.ldesfragment.mapReduce(map, reduce, {out:"ldesfragment_keys"});
     db.ldesfragment_keys.aggregate([{$project:{"_id": 0, "keys":"$value.keys"}}]);'
   ```
   This should return the following list of keys for the ldesfragment collection:
   ```json
   [
     {
       keys: [
         'root',
         'viewName',
         'fragmentPairs',
         'immutable',
         'softDeleted',
         'parentId',
         'numberOfMembers',
         'relations',
         '_class',
         'immutableTimestamp'
       ]
     }
   ]
   ```
   > **Note**: Changeset-1 will add the `softDeleted`, `parentId` and `immutableTimestamp` values to the model and will replace the `members` array with a value indicating the amount of members in the fragment in `numberOfMembers`

5. Verify that the ldesmember collection is structured as expected:
   ```bash
   docker exec -it upgrade-server-using-nifi_ldes-mongodb mongosh iow_devices --eval '
     var map = function(){
       var keys = [];
       Object.keys(this).forEach(function(k){
         if(k != "_id"){
           keys.push(k);
         }
        })
        emit(this.type,{"keys":keys});
     };
     var reduce = function(key,values){
       var uniqueKeys = {};
       var result = [];
       values.forEach(function(value){
         value.keys.forEach(function(k){
           if(!uniqueKeys[k]){
             uniqueKeys[k] = 1;
             result.push(k);
           }
         });
       });
       return {"keys":result};
     };
     db.ldesmember.mapReduce(map, reduce, {out:"ldesmember_keys"});
     db.ldesmember_keys.aggregate([{$project:{"_id": 0, "keys":"$value.keys"}}]);'
   ```
   This should return the following list of keys for the ldesmember collection:
   ```json
   [
     {
       keys: [
         'versionOf',
         'timestamp',
         'model',
         'treeNodeReferences',
         '_class'
       ]
     }
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
1. Stop data generator and stop new server:
```bash
docker compose stop new-ldes-server
docker compose stop json-data-generator
```

2. Bring all systems down:
```bash
docker compose --profile delay-started down
```
