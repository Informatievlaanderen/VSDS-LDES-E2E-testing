Feature: GTFS/RT use case

  Scenario: LDES Server Can Fragment an LDES Using Geospatial Fragmentation
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And the 'use-cases/gtfs-and-rt/2.geo-fragmentation' test is setup
    And context 'use-cases/gtfs-and-rt/2.geo-fragmentation' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'one-member'
    And I have aliased the data set
    And the LDES server is available
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    Then the LDES contains 1 members
    And the geo-spatial root fragment is not immutable
    And the geo-spatial root fragment contains multiple relations of type 'GeospatiallyContainsRelation'
    And the geo-spatial fragment '15/16743/11009' contains the member
    And the geo-spatial fragment '15/16744/11009' contains the member
    And the geo-spatial fragment '15/16742/11010' contains the member
    And the geo-spatial fragment '15/16743/11010' contains the member
