# Materialise members to a triplestore
This test verifies that members can be persisted to a triplestore using the HttpSparqlOut component.
The test contains two components, a Virtuoso triple store and a workbench containing
the HttpSparqlOut component. We will send data through the workbench and verify that it is stored
correctly in the triplestore.

## Test setup
1. Launch the LDIO workbench and virtuoso triple store:
    ```bash
    docker compose up -d
    ```

2. Wait for the workbench to be fully up and running:
    ```bash 
   while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```

3. Send the first set of data to the workbench
   ```bash
   chmod +x ./data/add/post.sh
   sh ./data/add/post.sh
   ```
   
4. Check the count of statements in the server.
   ```bash
   chmod +x ./checks/count/count.sh
   sh ./checks/count/count.sh
   ```
   There should be 21 triples in the triplestore.

5. Check if the Taylor Kennedy as given name 'Taylor'.
   ```bash
   chmod +x ./checks/name/check.sh
   sh ./checks/name/check.sh
   ```
   This should return Taylor.

6. Send an update to the workbench to change 'Taylor Kennedy' his given name to 'CHANGED'
   ```bash
   chmod +x ./data/update/update.sh
   sh ./data/update/update.sh
   ```
   This set will update a triple already in the store

7. Check if the count remains the same.
   ```bash
   sh ./checks/count/count.sh
   ```

8. Now check if the updated triple (Taylor Kennedy) has a changed Given name.
   ```bash
   sh ./checks/name/check.sh
   ```
   This should return only CHANGED.

## Test teardown
Stop data generator and new workbench, and bring all systems down:
```bash
docker compose down
```