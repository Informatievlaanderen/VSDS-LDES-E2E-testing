# Data can be sent to an RDF4J repository

This test validates user story [**Processor onboarding: RDF4J repository put** (VSDSPUB-409)](https://vlaamseoverheid.atlassian.net/browse/VSDSPUB-409) and was shown during demo 23 on March, 28th 2023.

## Scenario: Send members in a NiFi workflow to an RDF4J repository

This scenario verifies that LDES members that are passed between NiFi processors, can be funneled off to an RDF4J repository.
```gherkin
Given a workflow that processes LDES members
When the RDF4J repository materialisation processor is added to the NiFi workflow and started
Then the members will be sent to the configured RDF4J repository
```
> **Note**: we use imaginary people data in n-quad format, based on the [vCard to RDF mapping](https://www.w3.org/TR/vcard-rdf/)

### Test Setup
For this scenario we use a [docker workflow](docker-compose.yml) with a NiFi workbench and RDF4J workbench. Please copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change it as needed.

This demo makes use of a [Makefile](./Makefile) to simplify the commands that need to be executed.

You can run the systems by executing the following command:

```bash
export ENV_FILE=user.env
make run
```

The dockers are exposed on port 8080 ([rdf4j-workbench](http://localhost:8080/rdf4j-workbench)) and 8443 ([ldi-workbench-nifi](http://localhost:8443/nifi))

### Test Execution
To run the test, you need to:
1. Create the test RDF4J repository
2. Upload a pre-defined [NiFi workflow](rdf4j-repository-materialisation-workflow.json) containing a GetFile processor (to load the test data from the file system and transform it into FlowFile instances) and the RDF4JRepositoryMaterialisationProcessor (to send the LDES members to the RDF4J repository).
3. **Verify** that no data is present in the RDF4J repository
4. Copy the [initial data files](./data/add) to the [shared volume](./nifi)
5. **Verify** that the first name of Taylor Kennedy is '**Taylor**'
6. Copy the [updated data file](./data/update/17_taylor_kennedy_updated.nq) to the [shared volume](./nifi)
7. **Verify** that the first name of Taylor Kennedy was changed to '**CHANGED**'


#### 1. Create the test RDF4J repository
- Browse to the [RDF4J Workbench](http://localhost:8080/rdf4j-workbench)
- Click on 'New repository'
- Select type 'Memory Store', give it the id 'test' and click 'Next'
- On the next page, select 'In Memory Store' and click 'Create'

#### 2. Upload and start NiFi Workflow
Browse to the [Apache NiFi user interface](https://localhost:8443/nifi) (it may take a minute or two before it is available) and upload the [NiFi workflow](rdf4j-repository-materialisation-workflow.json) process group.

You can verify the GetFile processor and rdf4j processor properties.

##### GetFile
- Input directory: **/home/nifi/data**
- File Filter: **[^\.]+.nq**
- Batch Size: **1**
- Keep Source File: **false**
- Recurse Subdirectories: **false**
- Polling Interval: **0.1 sec**

##### RDF4JRepositoryMaterialisationProcessor
- RDF4J remote repository location: **http://rdf4j-server:8080/rdf4j-server**
- Repository ID: **test**

If everything looks in order, you can start the workflow.

#### 3. Verify that the RDF4J repository is empty
Run the following command to verify that no data is present on the RDF4J repository at this time.
```bash
make query
```

#### 4. Copy the initial data set
You can either manually copy the files from the (data directory)[./data/add] or run the following command:
```shell
make seed
```

#### 5. Verify the initial data set on the RDF4J repository
Run the following command to verify that the first name of Taylor Kennedy is '**Taylor**'
```bash
make query
```

#### 6. Copy the updated person data
You can either manually copy the (update file)[./data/update/17_taylor_kennedy_changed.nq] or run the following command:
```shell
make update
```

#### 7. Verify that the update was registered on the RDF4J repository
Run the following command to verify that the first name of Taylor Kennedy is now '**CHANGED**'
```bash
make query
```

### Test Teardown
First stop the workflow as described [here](../../tests/_nifi-workbench/README.md#stop-a-workflow) and then stop all systems by executing:
```bash
make stop
```
