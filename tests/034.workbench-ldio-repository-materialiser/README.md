# Materialise members to a triplestore


## Test setup
1. Launch the rdf4j repository server:
    ```bash
    docker compose up -d
    ```

2. Launch the ldio workflow:
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```
   
3. Create the repository in the rdf4j server:
   ```bash
   chmod +x ./data/config/create-repository.sh
   sh ./data/config/create-repository.sh
   ```

4. Send the first set of data to the workbench
   ```bash
   chmod +x ./data/add/post.sh
   sh ./data/add/post.sh
   ```
   
5. Check the amount of statements in the server.
   ```bash
   curl http://localhost:8080/rdf4j-server/repositories/test/size
   ```
   There should be 21 triples in the triplestore.

6. Check if the initial triple is present with the correct value.
   ```bash
   chmod +x ./data/update/check.sh
   sh ./data/update/check.sh
   ```
   This should return false.

7. Send the second set of data to the workbench
   ```bash
   chmod +x ./data/update/update.sh
   sh ./data/update/update.sh
   ```
   This set will update some triples already in the store

8. Check if the count remains the same.
   ```bash
   curl http://localhost:8080/rdf4j-server/repositories/test/size
   ```

9. Now check if the updated triple is present with the correct value.
   ```bash
   chmod +x ./data/update/check.sh
   sh ./data/update/check.sh
   ```
   This should return true.

## Test teardown
Stop data generator and new workbench, and bring all systems down:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose down
```