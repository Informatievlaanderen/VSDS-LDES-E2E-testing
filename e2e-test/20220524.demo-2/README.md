# Demo 2 - May, 24th 2022

This test demonstrates user story **As a data intermediary I want to request the GIPOD LDES data set without fragmentation** (VSDSPUB-61).

> **Note**: Currently, this LDES server E2E test is only available as a manual test, no automation yet.

This LDES server E2E test is essentially really simple: we use a [GIPOD simulator](../../ldes-server-simulator/README.md) which serves a subset of the original GIPOD data set, an Apache NiFi instance containing the LDES client NiFi processor and, the LDES server which allows to capture the LDES members emitted by the LDES client NiFi processor and serves the complete set as a single, unfragmented LDES.

C4 diagrams:

![LDES server demo - context diagram](https://www.plantuml.com/plantuml/png/XP9FRzim3CNl_XISJoxGn9UTTYhG15s133Ngx1me5XqJrHz3ekFssuzAOYzTKEmY2C_auu_FUeYi0W_MGBvPhMk868uOGAFri836EyPt1atg49JDis_a6ZDeX8wvZp_ACgXnUI3kXlqWhQTwnyl6sx8toYNZHMHjQ5y-VbzKIVhzQrDQ5Hc3IBl7yuHbBvLPniG6uVyWMLPXYDuLZCde7lBjwPBVPLdz8JUxMxzpqHWIcllRrQJkgYoI7OnYdtoUdgkN5SnABb9Djf-esg0ELZmdiq8P6UiKqn6XzG7E_TVpnewQxhI08XU1lGSxYA8LgxiPf3XNVsRD_q4dTv0rvGIBTYy9W78QVDjYIA9oW4xtdeGliSZCEDYUoRiKp2kQtMREv7hfW1m8ZtZsQxqnVeoV5uw9vUTsMq5XaJkluMczJVZ9zVMlwxH5FyGEBnuNs1k7wgMUBLRphxm6EnAEbqXlG6uRfzboKljnwKinooU6WBsXHZ7gBntczz84bC9J6c5mCFhmraecKsETudoGhENH_W40 "LDES server demo - context diagram")

![LDES server demo - container diagram](https://www.plantuml.com/plantuml/png/ZPDFZzem4CNl-HHkJa5QoAMddbOBQDkArQA5gaSq99F4glz4zWIAgdxtZY796jX3EI0pzhptynlpw0aSTLg9TBLOReH7Tq0dIjHMJ4LX3O4qeI2XTg3Jv9CqXUfA50rHwx_akOFZh9RKTFkEcqC76feLLkUj0XEafvvA9VVv_FDq7Ke_NbQv1a_ekBIR3nwpbiyc2KbIAFu79adMwBmr6M4GUn3fzhn89qcoEV5AxvQ_AVDITmh8XWFFtzQl2p5MKYvjf6u7myf1hHb_SCv0iPu1aWSKbNNYqX_37HjPD0ER5sIjq1rNIY2OC4a4ShJkLwNiyU4-wm3oizyUnAIfBqw5ae6fTRP0xsryloVRcHBSARjexHhhwLe-dVn917_6cFkZDwVuvtSuG7h3nWmSQI3HgFUSjW1J2bjLw48HZ41JjbOoNeY7oNsdMvBMCEILxJc14CeUF8ROENweCHY-M5FRnLDOpeSSpn2nvp0Qpy9_a-GDrMun3ZuUyK7YiP_JUm_NlswtQ-wzRen6KZW4mhENwyouCxHkxdh77FbRLgVUCroHjqWuR9KiMBAySLz53o46TqXEuW7x-rh59_prknml8ZADrDXIF2-tarxtBTOTsDhEDtWTvvt6-dKJYGojqQmy0_POxv0VIOQN-SWlWl_8_m00 "LDES server demo - container diagram")

![LDES server demo - component diagram](https://www.plantuml.com/plantuml/png/ZLJBRjim4BphAxQwr0QI-D9JJwdZD4sHD4Rit0eOjBYMYFAXyc7NAFBlNUeLMac0-aIiTcQ7iqDVEi-i3qf2VhUuNe53kqSB79M1SoYCger6xO4BLbgcyko3q8KC7A7oldQVPpFB3XUby5NO1W8NHdlglo3ah9PCH-fpvxaKszdLf_DbB3tTtyqKSnujbJPN_OoBcdgpp0il4HenXHJDx7V4PDaIhJDwuZ6IdK6-RWxvDCjMHpgfpVKVFt521ScyYGqtjyk71GoLd4eheUf-uCwoKiK9dGqJ9ebFCo_s23jZeSMdJXqgKLGGhys4Tk2D0HMemfbdKrAI23aO-sidpU7ijTTHo9UQ5HN23_5Lm84CXRw_PnUwFF6bjgP0vqnwuRa9cZDxdBJa6zUKJoVcqxyPqE-gfQMk4UhjzXRIxM12OiXiwhnj3l42tzcUvKF5WT1Sx0KFJBQo5QejBOpKlgOhZ4M2BemYHIdPF3YIw1n8KuhYfwQLI8ZTi0kwyC9e9eK_JjzaTRHZLaRYLNjAcHUqeIrp2BHNuolQXCNQE46TntSqQXTKP5k6hHG5YzDJnaVqmL88XYn9WZamcfX_X-XII_iyiZ-6WtTg4c6HyjxeqYpc17pEie-FA3UB8Uv9dWgBp2CmpS46FNo93D_Mw-MAyAVOz57i1HwwPFSFmFN8Ly0N4oWQOdViW54-vSL73njha8yexfByfzCjUYjmZwvHlpEIEjpfSnpKm4IXhmo7c-lrjEDzJ7Y7KDR1LUXEOpVcM3wiUfANe2HhYBKHHslm87WaijVJg-WotV1q38ETxRUNVFvNKqd-zkC6LuU5TED6JTabQav_hFy0 "LDES server demo - component diagram")

To run the E2E test manually, you need to:
1. Start the docker containers containing the GIPOD simulator, the Apache NiFi instance and the LDES server.
2. Verify that all the containers are correctly started.
3. Upload a pre-defined NiFi workflow containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the LDES server).
4. Start the NiFi workflow and wait for it to process all LDES members.
5. Verify that all LDES members from the GIPOD simulator are received by the LDES server.
6. Stop the docker containers.

## Start systems

To start the docker containers, you need to:
* create a [Github personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) (for scope `read:packages`)
* copy the [`.env.example`](./.env.example) file to `.env.user`
* fill in the credentials for Apache NiFi and the personal access token
* build and run the containers, passing your `.env.user` settings by executing in a bash shell:
```bash
docker compose --env-file .env.user up
```

After that, please verify all containers are ready:
* GIPOD simulator: http://localhost:9001/
* LDES server: http://localhost:8080/mobility-hindances

The Apache NiFi server needs a couple of minutes to start.
Once started, you can find the NiFi user interface at https://localhost:8443/nifi.


## Upload NiFi workflow

In order to upload the NiFi workflow you first need to log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `.env` file (or the alternative file passed in by `--env-file`).

Once logged in, you need to create a new process group based on a [pre-defined workflow](./data/replicate.nifi-workflow.json) (containing a LDES client and a InvokeHTTP processor).

See [Upload NiFi workflow](../20220524.demo-1/README.md#upload-nifi-workflow) for details.

## Start the workflow

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the LDES server.

* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-server:8080/mobility-hindrances` and the property `HTTP method` should be `POST`

To launch the workflow, ensure that no processor is selected (click in the workpace OR navigate back to the root process group and select the newly added process group) and click the start button.

See [Start the workflow](../20220524.demo-1/README.md#start-the-workflow) for details.

## Verify LDES members received

The GIPOD simulator is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served.

You can verify that, after some time, all LDES members are received by the LDES server by visit the following pages: http://localhost:8080/mobility-hindrances.

## Stop docker containers

To start all docker containers, you need to execute the following shell commands in a terminal:
```bash
docker compose down
```

This will gracefully shutdown all containers used in the E2E test.
