# Gebouwenregister & Adressenregister (GRAR) Use Case tests
These tests illustrate the epic **Make the Gebouwenregister en Adressenregister (GRAR) data stream available as LDES (epic)**, defined as:

> As a Data Provider, I want to publish my GRAR data set as a Linked Data Event Stream via my LDES server, which stores the LDES members containing Addresses, fragment them into a substring fragmentation and make them available, so that it can be used by Data Consumers to query by a part of the full addess.

The following tests are available:
* [Provide addresses as substring fragmentation](./1.addresses-substring-fragmentation/README.md): uses a workflow to receive some address updates and pass it to an LDES server configured for substring fragmentation to demonstrate this fragmentation
