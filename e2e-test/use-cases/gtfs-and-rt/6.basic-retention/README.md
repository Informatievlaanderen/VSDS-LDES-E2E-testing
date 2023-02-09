# LDES Server Provides a Very Basic Retention Mechanism
This test validates user story **As a data publisher I want to implement a retention policy for my data** and was shown during the demo on November, 22th 2022.

## Acceptance Criteria

* **AC1**: I can configure the **retention period** as a sliding window
* **AC2**: The LDES server automatically purges fragments older than the configured retention period.
* **AC3**: The LDES server only purges **immutable** fragments (to prevent deleting ‘active’ fragments).
* **AC4**: The LDES server replaces (only in *mutable* fragments!) purged fragment references (**relations**) with the ‘first available' fragment.
* **AC5**: The LDES server also purges **orphaned** LDES members.
* **AC6**: The LDES exposes some **metrics** to allow monitoring the retention mechanism: the amount of members purged (e.g. “deleted member count”).

## Test Scenario
For this scenario we use a [custom Simulator / Workflow / Server / Mongo](./docker-compose.yml) context. This sets up a simulator without seeding, an empty Apache NiFi, an LDES server and a MongoDB backed by permanent storage.

We send some test files (GIPOD mobility hindrances) to our Simulator which then serves these files on request. We use a simple workflow containing an LDES Client, which requests the test files from the Simulator, and a standard InvokeHTTP processor, which POSTs the individual items to our LDES server. Our LDES server is configured to ingest the items and serve two timebased fragmented views. One view is configured to create fragments containing max. 150 members and with a short retention (60 seconds) while the other view is configured to create fragments of 300 members and keep them for a longer time (90 seconds).
The retention periods are indicated in a standard way ([ISO 8601 durations](https://en.wikipedia.org/wiki/ISO_8601#Durations)), e.g. `P3D` (3 days).

### Start Systems
When started, we expect that the LDES server creates the initial state: the LDES itself (L) and the two views (V and W).

![1.system-started](https://www.plantuml.com/plantuml/png/LOyn2yCW48LtVyMHiH0e7HrA4BlPgQ13wP2IQo8O1RqsVxyNmI7R-xx7FRYXq9ZfkmR1WH2wUufpqgg3iO1MpHfzUu2fqZHdFMvWgxC7vwfpGZnFB-W3VgY_xbiLiv-NdOqmq4zfYvpjdbl1Trf9M75zOouIpbnA-F4mmqLOXeo4aNoA4igICc4MxgW3Vy5sm3ZnRty0 "1.system-started")

*Fig. 1: system started*

### Send Initial Data Set
We use a [data set](./data/) with 5 input files (total of 617 items):
* [alfa](./data/alfa.jsonld) (250 items)
* [beta](./data/beta.jsonld) (250 items)
* [gamma](./data/gamma.jsonld) (1 items)
* [delta](./data/delta.jsonld) (50 items - adds 49 new items to `gamma`)
* [epsilon](./data/epsilon.jsonld) (117 items - adds 67 new items to `delta`)

First we send `alfa`, `beta` and `gamma` to the simulator which should result in 501 items being fragmented as follows:
* a first view V with three immutable (forward-connected) fragments A, B and C each containing 150 items and one mutable fragment D holding 51 items
* a second view W with one immutable fragment F with 300 items and one mutable fragment G with 201 items

![2.initial-data-ingested](https://www.plantuml.com/plantuml/png/VP8nRuCm48Lt_ufJibL2WbGCOQY2SSr2fqemL1r8uX0aR2hZDEg_xs6AR589fdlVU_BT6Hy6Ksjpant1mWZOlFMgwHdTG3q0ex2zuBVVpsx1Nj-Xi6Onix8LToWjAnUiigoQ6TTr8uKoa5gUmhPhcwjfj13gNsOQWAvcCfl9LZDiMcGrmss6hsPocyaN6VBnz0b19oucUC6xcgGUVTG5AI0uztU5TJdMir6HqecKf4vGGft8IEO48vKJd70dSa8OJK0AUHHwI20E8soMm3V-09GxR9R0gVwgJwtvII2AGppA9yzXQ3DQ6DopxLK2mxNNHcWRz727BmDf2bwxyJpw2B97m7mGHpY_fyS1SX_iS8MnIIlbpTJ7JjWEJcKBPS_-g_d2oJtd8DGP7_al "2.initial-data-ingested")

*Fig. 2: initial data ingested*

### Wait for Fragments to Expire
After the retention period for view V expires, the fragments A, B and C should be indicated as deleted and when requesting them the LDES server should return an HTTP error code (410 - `GONE`) - **AC2** and **AC3**. When requesting the view V we expect that it refers to fragment D instead of to fragment A - **AC4**. 

![3.first-retention-expired](https://www.plantuml.com/plantuml/png/bPAzReCm54PtFyLLkbMY8gcwk58LZ0iBdIh1K7KWyYqW6ICPf-dZz-88sH5JjkySSty07sVNMdSUDQFW47OVa-acANRGpY35QYlv_WcLbzNgwW4lK7jNtxZ6ksPrXMsx4Os3pFiC7lHWa5jKhqjuKktSKtRuvnQvARlk8kujotrPVc-PlBxvnXVU5njVUbyozlNu3Od67vUyBH_EenswVk6ALP2ewM8erqjU3nfM1v0i2o2O292pF7wi2L2m8W1j8GM74SSJsfd3IxgdOHn-wQyG7cWO1ukEzXucms7k9-lGKhyRhUaAa9KGjzhJe8YVqvILiJZGh8o4GasT56qVSXvbt_NisfD6tt4OLogZaoCQHPVo7m00 "3.first-retention-expired")

*Fig. 3: first retention period expired*

Because the same members are fragmented by the two views, we expect members to be pruned only after both fragments that refer to them have expired. Therefore we verify in the database that no members are pruned yet (we expect 501 members) as they are still referred to by the fragment F in view W.
> **Note** the view V may possibly still refer to fragment C or even fragment B as the retention algorithm uses a fragment's immutability timestamp value, i.e. the moment a fragment is full and it refers to the next fragment (created on arrival of its first member).

> **Note** that because the retention period of view W did not yet expired, we expect the view W is unchanged.

Then we wait for the retention period for view W to expire and then validate that view W now refers to fragment G. We also verify that now the members are actually pruned in the database (we expect 201 members) because they are not referenced anymore in any (not-deleted) fragment - **AC5**.

![4.both-retentions-expired](https://www.plantuml.com/plantuml/png/bP8nRuCm48Lt_ufJibLAbLJg44UgWd5XeLCb6AeEHBu0aZ6ISPhst_SmHIPb2jDxdtdF9zl7tfNMNLhDI3Y4rLjdgawA5PGzI07hCttx_RIQoTTtoFnYDh6ymIladkKthF2ic5XYowf5uo3oF8ArRWpookBFOL2FgknhL0U7tyxJHN2SIjmVZ7qmlZyentDOyCJpvA_GKiUYZ-0YblfOojZ7moTiD9xTveLEURIsgUh1Poo3ZUgkXdG-w6cXO7amaaN122Q2YLay_wq89cN9t30fEBJOdj3s79wsEzgCmnTTtM1fCmuM7StTT8P3NtVMeQM-6wpflH2LCAjwth4K_bL711Hg2YeQDkXufdt9nPKdZJHfuEcC7z4eUgw_ "4.both-retentions-expired")

*Fig. 4: both retention periods expired*

### Feed More Data 
Because only immutable fragments are deleted we feed the Simulator with more data (`delta` and `epsilon`), resulting in the LDES client to synchronize our LDES server with the new items (an additional 116 items, i.e. 617 total items - 501 already posted items). This should result in new fragments being created in both views to hold these new items (bringing the - database - total to 317 items, i.e. 201 current items + 116 new items).

![5.newdata-ingested](https://www.plantuml.com/plantuml/png/bLD9Ru905BxFhtZHMnCRhMcCc3G2mtAWfoPmQ7f0UI89IpECjVxxFeRI6JGzoEdRtZ83R5kP2dcgIaP08anUcpflk3E1j0NkmFH0ptezk17ttY1IPZHeSO5dY9KMZxH4QScW-IBDAwmbs4gtOLeMDLgvmCkcGuzPsXunsqZybagzAUotSkulT5MXUtyXx-_X-Xh-V4_vNjSuFqfgWVLDnbSP__xXWIeC_XqUAZyS3MVl3nymA_4WPo_q_degEfzun2AOPSsv9XntU30I5cl2cQs9mnnDNEQQCQw9nn9D0kQR9D0aP8mx5bHOxL2q5YmNArh3WY_wN8W-qHeMxDFFT5_8YmMBvpdrDPNbVAuo0YNTGD7K5hJ7HaWKAcZ89Nt7fDgaPbYIdj59D7ODpC5OgPlfZOGLdS3ScLO8hm9TXwAgJZBTbTYN_sBVc1ECKg6HscATqJ_u0m00 "5.newdata-ingested")

*Fig. 5: new data ingested*

### Wait Again for Fragments to Expire
Finally, we wait a bit longer until the immutable fragments in both views expire and expect that only one fragment remains undeleted per view and that the expired LDES members are again purged leaving only the LDES members referred to by the remaining fragments (we expect 17 members).

![6.immutable-fragments-expired](https://www.plantuml.com/plantuml/png/bPDBRuCm48Jl_XMhv5Of5MrLLI5I5S0y3lHK2GvH3qxO42GUbN6QvjztunJP2ISupNopWzOyrhqIKXsRcf5G2BEFhYqxxiz0zC1zcE_fMYw7DENX9wGwJ0UMLNY2JBFiXkMQvGEBf2WRR1LucdimhwiMtLBYUNLHZuNe3rYi5FugJKV5wrR-z6AWYy7q8hy-X_-YfDbHZ-2e5kfQ2ACWqa4qVP5O5-EfYoIwbW1ZcuSlMDIuLujtUgzNAwloSF4fIs5HTAUMT7RHGv2pp9YGUSRup3ScO84nd76xankJiCYOcCLsmhZlGeFD5cNlmjCRRU723tr5v9vf2nTsubliAdMczDMXszhanN7qZ4H5fwwwreN-q4c5KWzQkARFcwX7jC2QU447CJgmT0Yt6oLtdj_F7fNOraY7D3osT6BDhB4jwAVx0m00 "6.immutable-fragments-expired")

*Fig. 6: all immutable fragments expired*

## Test Setup
If needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Then you can run the systems by executing the following command:
```bash
docker compose up -d
```
> **Note**: it may take a minute for all the servers to start.

## Test Execution
To execute this test scenario, run the following steps:

1. verify the initial LDES:
```bash
curl http://localhost:8080/mobility-hindrances
curl http://localhost:8080/mobility-hindrances/by-short-time
curl http://localhost:8080/mobility-hindrances/by-longer-time
```

2. send initial data set and verify simulator at http://localhost:9011:
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/alfa.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/beta.jsonld'
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/gamma.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```

3. open MongoDB Compass and keep an eye on the member count

4. logon to the Apache NiFi user interface at https://localhost:8443/nifi, load and start the [workflow](./nifi-workflow.json)

5. verify that all fragments are created for both views, following all links in the views, and check the mutability:
```bash
curl http://localhost:8080/mobility-hindrances/by-short-time
curl http://localhost:8080/mobility-hindrances/by-longer-time
```

6. wait for the shorter retention period to elapse and verify that the short-time view now refers to its last fragment, that requesting the other fragments returns an HTTP error (410 - GONE) and that in the database the member count did not change

7. wait for the longer retention period to elapse and verify that the longer-time view now refers to its last fragment and that the member count has decreased (because some members have no more references)

8. feed more data:
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/delta.jsonld'
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/epsilon.jsonld'
```

9. verify that in each view one additional fragment is created and the previous fragment is marked immutable, and that the member count has increased (because new members have been received)

10. wait for both retention periods to elapse and verify that again the views refer to the newest fragments, that the older fragments are deleted and that the member count has decreased again

## Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink/README.md#stop-the-systems), i.e.:
```bash
docker compose down
```
