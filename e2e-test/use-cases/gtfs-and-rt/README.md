# GTFS and GTFS/RT Use Case Tests
These tests illustrate the epic **Make a GTFS and GTFS-RT data set available to data consumers Linked Connections Event Stream (epic)**, defined as:

> As a Data Provider, I want to publish my GTFS and GTFS-RT data set as a Linked Connections Event Stream via my LDES server, which stores the Linked Connections Event Stream members, fragment them into a time based and geospatial  fragmentation and make them available, so that it can be fed to an online map via an LDES client showing the departure and arrival times and real time delays.

The following tests are available:
* [Ingest LDES (GTFS)](./1.ingest-ldes/README.md): uses a workflow (containing a standard ListenHTTP processor and a standard InvokeHTTP processor) to buffer and forward GTFS/RT data towards the LDES server to test the LDES server's ability to correctly ingest and store a large volume of LDES members.
* [Geospatial fragmentation (GIPOD)](./2.geo-fragmentation/README.md): uses a workflow to ingest data containing a geospatial property to test the LDES server's ability to do geospatial fragmentation and ability to configure the type of fragmentation.
* [Multi-level fragmentation (GIPOD)](./3.multi-level-fragmentation/README.md): uses a workflow to ingest data containing a geospatial property to test the LDES server's ability to do fragmentation using a combination of fragmentizers.
* [Multi-view fragmentation (GIPOD)](./4.multi-view/README.md): uses a workflow to ingest data containing a geospatial property to test the LDES server's ability to create multiple with different fragmentations.
* [Geospatial fragmentation (GTFS/RT)](./5.including-stops/README.md): uses the same workflow as the first test to ingest GTFS/RT data and create a single view using geospatial fragmentation.
* [Basic retention (GIPOD)](./6.basic-retention/README.md): uses the GIPOD data set to verify the LDES Servers ability to do very basic purging of older data to keep the data set limited to a manageable size and prevent high storage costs
