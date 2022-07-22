# GIPOD use case tests
These tests illustrate the epic **Make a copy of the GIPOD data set available to data consumers by means of standard LDES components (epic)**, defined as:

> As a Data Intermediary, I want to replay the GIPOD data set using an LDES client to my LDES server, store the LDES members and make them available using an identical interface as the GIPOD server, so that my LDES server can be used as a drop-in replacement for the GIPOD server.

The following tests are available:
* [replicate LDES](./1.replicate-ldes//README.md): uses the LDES client to replicate (a subset of) the GIPOD data using a workflow towards a simple member sink to test replicating LDES (retrieve first fragment and follow all relations to other fragments, effectively replaying all LDES members).
* [ingest LDES](./2.ingest-ldes/README.md): uses the LDES client to replicate (a subset of) the GIPOD data using a workflow towards the LDES server to test the LDES server's ability to correctly ingest and store LDES members.
