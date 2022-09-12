# Internet of Water (IoW) Use Case tests
These tests illustrate the epic **Make the Internet of Water data set available to data consumers Linked Connections Event Stream (epic)**, defined as:

> As a Data Provider, I want to publish my IOW data set as a Linked Data Event Stream via my LDES server, which stores the LDES members containing Water Quality Observations, fragment them into a time based fragmentation and make them available, so that it can be fed to an online map via an LDES client showing the available water sensors and their up to date measurements. This demonstrator should be plugable into different webinterfaces (VSDS Demo page, VMM Dataportaal, Website lokale besturen).

The following tests are available:
* [Translate NGSI-v2 to NGSI-LD](./1.ngsi-v2-to-ld/README.md): uses a workflow (containing a standard ListenHTTP processor for NGSI-v2 input and a standard PutFile processor for NGSI-LD output) to verify the custom NGSI-v2 to NGSI-LD NiFi translator
* [Convert NGSI-LD to version objects](./2.ngsi-ld-to-version-objects/README.md): uses a workflow (containing a standard ListenHTTP processor for NGSI-LD input and a standard PutFile processor for modified NGSI-LD output) to verify the creation of LDES members (version objects) from NGSI-LD using a custom NiFi processor
* [Ingest NGSI-v2 objects into LDES server](./3.ngsi-v2-to-ldes/README.md): uses a workflow (containing a standard ListenHTTP processor, a NGSI-v2 to NGSI-LD translator, a version objects creator and a standard InvokeHTTP processor) to ingest LDES members into an LDES server
