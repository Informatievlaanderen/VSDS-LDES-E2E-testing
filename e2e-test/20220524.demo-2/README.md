# Demo 2 - May, 24th 2022

This test demonstrates user story **As a data intermediary I want to request the GIPOD LDES data set without fragmentation** (VSDSPUB-61).

> **Note**: Currently, this LDES server E2E test is only available as a manual test, no automation yet.

This LDES server E2E test is essentially really simple: we use a [GIPOD simulator](../../ldes-server-simulator/README.md) which serves a subset of the original GIPOD data set, an Apache NiFi instance containing the LDES client NiFi processor and, the LDES server which allows to capture the LDES members emitted by the LDES client NiFi processor and serves the complete set as a single, unfragmented LDES.

C4 diagrams:

![LDES server demo - context diagram](https://i.imgur.com/OvMZBs9.jpg "LDES server demo - context diagram")

![LDES server demo - container diagram](https://i.imgur.com/OvMZBs9.jpg "LDES server demo - container diagram")

![LDES server demo - component diagram](https://i.imgur.com/OvMZBs9.jpg "LDES server demo - component diagram")

To run the E2E test manually, you need to:
1. Start the docker containers containing the GIPOD simulator, the Apache NiFi instance and the LDES server.
2. Verify that all the containers are correctly started.
3. Upload a pre-defined NiFi workflow containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the LDES server).
4. Start the NiFi workflow and wait for it to process all LDES members.
5. Verify that all LDES members from the GIPOD simulator are received by the LDES server.
6. Stop the docker containers.

## Start systems

> **Note**: currently, we do not create and push artifacts to external repositories such as Maven central and Docker Hub so we need to build all the systems from code. Therefore, before building and running the simulator, sink and client demo (empty Apache NiFi) systems, please ensure the source code repositories are up to date (open a terminal at the location of this file and execute these commands):
> ```bash
> cd ../../../VSDS-LDESClient-NifiProcessor/
> git switch main
> git pull
> git checkout a57c6173
> cd ../VSDS-LDESServer4J/
> git switch main
> git pull
> git checkout 394b4463
> cd ../VSDS-LDES-E2E-testing/e2e-test/20220524.demo-2/
> git switch main
> git pull
> git checkout **TODO**
>```

To start all systems you need to [build and run the docker containers](../20220524.demo-1/README.md#start-docker-containers). E.g.

```bash
docker compose --env-file .env.user up
```

After that, please verify all containers are ready:
* GIPOD simulator: http://localhost:9001/
* LDES server: http://localhost:8080/ldes-fragment

The Apache NiFi server needs a couple of minutes to start.
Once started, you can find the NiFi user interface at https://localhost:8443/nifi.


## Upload NiFi workflow

In order to upload the NiFi workflow you first need to log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `.env` file (or the alternative file passed in by `--env-file`).

Once logged in, you need to create a new process group based on a [pre-defined workflow](./data/replicate.nifi-workflow.json) (containing a LDES client and a InvokeHTTP processor).

See [Upload NiFi workflow](../20220524.demo-1/README.md#upload-nifi-workflow) for details.

## Start the workflow

To launch the workflow, ensure that no processor is selected (click in the workpace OR navigate back to the root process group and select the newly added process group) and click the start button.

See [Start the workflow](../20220524.demo-1/README.md#start-the-workflow) for details.

## Verify LDES members received

The GIPOD simulator is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served.

You can verify that, after some time, all LDES members are received by the LDES server by visit the following pages: http://localhost:8080/ldes-fragment.

## Stop docker containers

To start all docker containers, you need to execute the following shell commands in a terminal:
```bash
docker compose down
```

This will gracefully shutdown all containers used in the E2E test.
