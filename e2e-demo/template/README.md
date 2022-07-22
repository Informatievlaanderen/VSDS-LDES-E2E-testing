# E2E-test automated testing setup

This is a template for the automated testing of nifi flows in the LDES client.

It is taken from the base code of the [first demo given on May, 24th](../20220524.demo-1/README.md).

To demonstrate the correct working of the LDES client you need to:

1. [Pre-requisites](#pre-requisites)
2. [Configuration](#configuration)
3. [Scripts](#scripts)
4. [Start systems](#start-systems)
5. [TODO](#todo)

## Pre-requisites

- [docker](https://www.docker.com/)
- [jq](https://stedolan.github.io/jq/)
- a working [bash](https://www.gnu.org/software/bash/) environment (windows users may need [wsl](https://docs.microsoft.com/en-us/windows/wsl/install))

## Configuration

### Authentication

Docker-compose passes the environment variables `SINGLE_USER_CREDENTIALS_USERNAME` and `SINGLE_USER_CREDENTIALS_PASSWORD` to nifi. Choose appropriate values in your environment file ([`.env`](.env) or [`.env.local`](.env.local)). If ommitted then nifi will generate values and the automated test will not run.

### LDES data set

The [data](data) directory is mounted as a docker volume, with the container directory given as the `SEED` argument for the LDES server simulator. In this template the directory used is [data/gipod/initial](data/gipod/initial).

### nifi flow

The nifi flow file can also be found in the [data](data) directory.
The `DATASOURCE_URL` parameter of the LDES server simulator that provides the data set, can be set with the environment variable `LDES_SERVER_SIMULATOR_URL` ([`.env`](.env)/[`.env.local`](.env.local)). For the dockerized e2e-test setup, this should refer to the container name given in docker-compose, i.e. `http://ldes-client-sink/member`.

The `Remote URL` parameter that the InvokeHTTP processor in the (LDES client) nifi instance uses to send members to, can be set with the environment variable `LDES_CLIENT_SINK_URL` ([`.env`](.env)/[`.env.local`](.env.local)). For the dockerized setup e2e-test setup, this should refer to the container name given in docker-compose, i.e. `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-20T09:58:15.867Z`.

### Timezone

Set the desired timezone for nifi in [`ldes-client-workflow/conf/bootstrap.conf`](ldes-client-workflow/conf/bootstrap.conf) with the variable `java.arg.8`. All available timezones for your system can be obtained from the `java.util.Timezone.getAvailableIDs()` static method. It is currently set to `Europe/Brussels`.

## Scripts

### [make.sh](./scripts/make.sh)

Combines other scripts with convenience calls that build, start and stop dockers. It also sets up the nifi instance.
Currently it accept no parameters and just creates and starts the nifi process group.

```bash
./scripts/make.sh
```

### [nifi.sh](./scripts/nifi.sh)

Contains scripts that deal with nifi. Use/Extend this to load flow files, create and start process groups.

The nifi script will replace the `DATASOURCE_URL` and `Remote URL` properties in [synchronize.nifi-workflow.json](./data/synchronize.nifi-workflow.json) with the values provided in your environment file ([`.env`](.env)/[`.env.local`](.env.local)).

When creating the process group, any existing process groups with the same name will be removed.

### [docker-compose-dev.sh](./scripts/docker-compose-dev.sh)

This script
- Creates directories that are mounted in docker, to ensure local user ownership
- Loads the appropriate .env file ([`.env`](.env) or [`.env.local`](.env.local))
- Calls docker-compose with `COMPOSE_DOCKER_CLI_BUILD=1` and `DOCKER_BUILDKIT=1` to enable build stage caching

It also explicitly specifies the [`docker-compose.yml`](docker-compose.yml) and passes on any additional arguments you supply to `docker-compose`.

Usage examples:
```bash
./scripts/docker-compose-dev.sh build --no-cache
./scripts/docker-compose-dev.sh up
./scripts/docker-compose-dev.sh up --build
```

## Start systems

To start all systems you need to build and run the docker containers.
The `docker-compose-dev.sh` scripts wraps the docker-compose command and provides some additional convenience by setting up bridged directories and choosing the correct environment file (`.env` if `.env.local` is not present).

```bash
./scripts/docker-compose-dev.sh up --build
```

When the containers are started, open a new terminal and execute
```bash
./scripts/make.sh
```
to setup nifi and start the processes.

Several stages are executed:
- Cloning and building the [LDESClient nifi processor](https://github.com/Informatievlaanderen/VSDS-LDESClient-nifiProcessor.git)
- Setting up and configuring nifi

No further setup is needed after the previous 2 commands. The nifi processes will be started and after a small amount of time, data should be available at http://localhost:9003 (member count) and http://localhost:9003/member (LDES member IDs).

## TODO
- Also provide a working setup using docker images
- Extend and adapt the scripts and environment files to allow for easy building of other demo's
- Build images that are built with revision tags, to make the demo's repeatable and reproducible.
- Clean up the data sets, reuse across demo's where able and applicable.
