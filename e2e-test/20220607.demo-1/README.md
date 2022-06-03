# Demo 1 - June, 7th 2022

This test demonstrates user story **As a data intermediary I want to keep in sync with changes in the GIPOD LDES data set.** (VSDSPUB-60).

> **Note**: currently, there is no automated test for this demo.

This LDES client E2E test is very similar to the [first demo given on May, 24th](../20220524.demo-1/README.md).

The same context applies:

![LDES client demo - component diagram](https://www.plantuml.com/plantuml/png/ZLHDSzf03BtxLwXS2ZCaN7hgAGqaQLhQC86ScSKMU2VxuUvgxMOw-U_L6jkn0vqf5tjalQUd9uahJy9Hq0f6oyND6b8bqH1ag2rSG6frOKqTaEBWX1ub7wH9LSWGSgB2VvxDdAWk3vBoi0iUNMeDSVub8sU54YPINtZAbDpDvfykLZ7qz6Cvqy8JEWvjvssDou9pauGaAOJ_4PCaAtJUcZ5X99l2Q5E_Z2P9idxXDxsz-KrZBtLGWcnCkBjVFIoWYumuj9QwQ0lkdJZeM84xAT71M2ZcCu9aYR2t3exuEhT9gNAPvX3R5j9u86j11uvaWiI4bGo4cETfuxD6lMFn46DHnL9IRFlhPhDgcKMQOa7I7620s3khWVA1HRsEhsqmcN0luygwvxsorTRN7wR30I_Oqz7aJmBycn_5epi5lqEruHPvH3TZ6H-JjeMpANfV-zq7T_7OxpTHYlXCWoVkvqiXKcxffxoLRtbGEL4Kx4Hqli-qNdpdZay5_0eOa4dhPsJlqzwoxbkfy2moBlD0-BqfxJFMupYhcyycEfNzGtbKN8DvQNKmCkKLigOf_Pgy9id7HrJRHRUwFSDJXu8Gc1zSC6-UywT8kMQMY7qwutT_rHsIarYYhvdsLZ677wwvRpbXh95ocy7TpMRIy3-UuMyDBeBFcLYQJ9Oo2q8DLhGZQD9Fp6LtAlREdqCzdSoYEPkcvW3oNlxgOTtfNtRUzbqf9LRD5P-uqEb-0zQL-HZb_gL1nRlc2oLmMAWuLynw-EGAJSP_Oty1 'LDES client demo - component diagram')

To demonstrate the correct working of the LDES client you need to:

1. [Start systems](#start-systems).
2. [Setup demo](#setup-demo).
3. [Replicate](#replicate) - previous demo
4. [Synchronize](#synchronize) - goal of this demo
5. [Stop systems](#stop-systems)

## Start systems

> **Note**: currently, we do not create and push artifacts to external repositories such as Maven central and Docker Hub so we need to build all the systems from code. Therefore, before building and running the simulator, sink and client demo (empty Apache NiFi) systems, please ensure the source code repositories are up to date (open a terminal at the location of this file and execute these commands):
> ```bash
> cd ../../../VSDS-LDESClient-NifiProcessor/
> git checkout main
> git pull
> cd ../VSDS-LDES-E2E-testing/e2e-test/20220610.demo-1/
> git checkout main
> git pull
>```

To start all systems you need to [build and run the docker containers](../20220524.demo-1/README.md#start-docker-containers). E.g.

```bash
docker compose --env-file .env.user up
```

After that, please [verify all containers are ready](../20220524.demo-1/README.md#verify-docker-containers-are-started).

## Setup demo
To setup the demo we need to [create a new process group using the provided template](../20220524.demo-1/README.md#upload-nifi-workflow) and verify the connections (see first part of [start the workflow](../20220524.demo-1/README.md#start-the-workflow)).

For the demo we use a data set containing three fragments in the initial set (replication):
* `alfa.json.ld` (250 items)
* `beta.json.ld` (250 items)
* `gamma.json.ld` (1 item)

We use two file that allow us to update the last fragment (synchronization) :
* `delta.json.ld` (50 items)
* `epsilon.json.ld` (117 items)

In addition we need to upload all but the last fragment as an immutable fragment and the last fragment with a freshness indication in (in seconds, see [max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#response_directives)). To do so, please use an HTTP client that can POST to a URL, such as [Postman](https://www.postman.com/) (graphical tool) or [curl](https://curl.se/) (command line tool, just celebrated its [23th birthday](https://daniel.haxx.se/blog/2021/03/20/curl-is-23-years-old-today/)!). The command line instructions are:
```bash
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@data/gipod/initial/alfa.jsonld'
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@data/gipod/initial/beta.jsonld'
curl -X POST http://localhost:9001/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/gipod/initial/gamma.jsonld'
```

**Note** the `?max-age=10` part in the last command limiting the freshness to 10 seconds.

The simulator will respond with:
```json
{"content-type":"application/json-ld","cache-control":"public, max-age=604800, immutable","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-20T09:58:15.867Z"}

{"content-type":"application/json-ld","cache-control":"public, max-age=604800, immutable","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-25T10:22:45.82Z"}

{"content-type":"application/json-ld","cache-control":"public, max-age=10","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-06-03T07:58:29.2Z"}
```

**Note** the `"cache-control":"public, max-age=604800, immutable"` for the first two fragments and the `"cache-control":"public, max-age=10"` for the last one.

## Replicate
After all systems are running and the fragments are uploaded to the simulator, [the workflow can be started](../20220524.demo-1/README.md#start-the-workflow) and you can validate that after a small amount of time all [LDES members are available](../20220524.demo-1/README.md#verify-ldes-members-received) (replicated) in the sink system.

To verify all members are received (execute repeatedly):
```bash
curl http://localhost:9003/
```
**Note** that after a short while the result should be (alfa + beta + gamma):
```json
{"count":501}
```

## Synchronize
This part is the actual purpose of the demo: showcase that the *synchronization* works after the initial data set is *replicated*.

Before uploading an update of the last fragment, you can verify that the LDES client re-requests the last fragment on a regular interval (definied by the amount of seconds in the `?max-age=10` part when uploading it, i.e. every 10 seconds).

Now if you upload the updated last fragment, you will notice that the sink will receive the additional LDES members from the updated fragment.

To upload the updated last fragment:
```bash
curl -X POST http://localhost:9001/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/gipod/updates/delta.jsonld'
```

To verify all LDES members are received, execute the following command (repeatedly):
```bash
curl http://localhost:9003/
```
**Note** that after a short while the result should be (alfa + beta + delta):
```json
{"count":550}
```

You can upload the second update for the last fragment and again validate the new members are received in the sink.

To upload the last update for the last fragment:
```bash
curl -X POST http://localhost:9001/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/gipod/updates/epsilon.jsonld'
```
**Note** that after a short while the result should be (alfa + beta + epsilon):
```json
{"count":617}
```

## Stop systems
Now you can gracefully [stop all systems](../20220524.demo-1/README.md#stop-docker-containers).
