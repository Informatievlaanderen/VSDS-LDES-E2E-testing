# GIPOD Use Case Tests
These tests illustrate the epic **Make a copy of the GIPOD data set available to data consumers by means of standard LDES components (epic)**, defined as:

> As a Data Intermediary, I want to replay the GIPOD data set using an LDES client to my LDES server, store the LDES members and make them available using an identical interface as the GIPOD server, so that my LDES server can be used as a drop-in replacement for the GIPOD server.

The following tests are available:
* [Replicate LDES](./1.replicate-ldes/README.md): uses the LDES client to replicate (a subset of) the GIPOD data using a workflow towards a simple member sink to test replicating LDES (retrieve first fragment and follow all relations to other fragments, effectively replaying all LDES members).
* [Ingest LDES](./2.ingest-ldes/README.md): uses the LDES client to replicate (a subset of) the GIPOD data using a workflow towards the LDES server to test the LDES server's ability to correctly ingest and store LDES members.
* [Synchronize LDES](./3.synchronize-ldes/README.md): uses the LDES client to (after replicating) synchronize (a subset of) the GIPOD data using a workflow towards a simple member sink to test synchronizing LDES (re-request non-immutable fragments in order to receive changes to the data set).
* [Time-fragment LDES](./4.time-fragment-ldes/README.md): uses the LDES client to replicate (a subset of) the GIPOD data using a workflow towards the LDES server to test the LDES server's ability to correctly (time-)fragment LDES members.
* [Paginate LDES](./5.paginate-ldes/README.md): uses the LDES client to replicate (a subset of) the GIPOD data using a workflow towards the LDES server to test the LDES server's ability to correctly paginate LDES members.
