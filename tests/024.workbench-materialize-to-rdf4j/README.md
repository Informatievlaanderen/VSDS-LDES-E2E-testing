# Materialise members to a triplestore
This test verifies that members can be persisted to a triplestore using the RDF4JRepositorySink component.
The test contains two components, an RDF4J repository server hosting a triple store and a workbench containing
the RepositoryMaterialiser component. We will send data through the workbench and verify that it is stored
correctly in the triplestore.

## Test setup
1. Launch the RDF4J repository server:
    ```bash
    docker compose up -d
    ```

2. Launch the LDIO workflow:
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```

3. Create the repository in the RDF4J server:
   ```bash
   chmod +x ./data/config/create-repository.sh
   sh ./data/config/create-repository.sh
   ```

4. Send the first set of data to the workbench
   ```bash
   chmod +x ./data/add/post.sh
   sh ./data/add/post.sh
   ```
   
5. Check the count of statements in the server.
   ```bash
   curl http://localhost:8080/rdf4j-server/repositories/test/size
   ```
   There should be 21 triples in the triplestore.

6. Check if the Taylor Kennedy as given name 'Taylor'.
   ```bash
   chmod +x ./data/check.sh
   sh ./data/check.sh
   ```
   This should return Taylor.

7. Send an update to the workbench to change 'Taylor Kennedy' his given name to 'CHANGED'
   ```bash
   chmod +x ./data/update/update.sh
   sh ./data/update/update.sh
   ```
   This set will update a triple already in the store

8. Check if the count remains the same.
   ```bash
   curl http://localhost:8080/rdf4j-server/repositories/test/size
   ```

9. Now check if the updated triple (Taylor Kennedy) has a changed Given name.
   ```bash
   sh ./data/check.sh
   ```
   This should return CHANGED.

## Test teardown
Stop data generator and new workbench, and bring all systems down:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose down
```