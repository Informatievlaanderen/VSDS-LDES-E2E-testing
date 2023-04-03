Feature: GTFS/RT use case

  Scenario: 1. Simple Ingest GTFS/RT Processing
    Given the members are stored in collection 'ldesmember' in database 'bustang'
    And I have configured the 'VIEWS_0_FRAGMENTATIONS_0_CONFIG_MEMBERLIMIT' as '250'
    And context 'use-cases/gtfs-and-rt/1.ingest-ldes' is started
    And the LDIO workflow is available
    And the LDES server is available
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    And the LDES contains at least 250 members
    Then the pagination fragmentation exists in the connections LDES
    And the first page contains 250 members

  Scenario: 2. Geo fragmentation
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And context 'use-cases/gtfs-and-rt/2.geo-fragmentation' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'one-member'
    And I have aliased the data set
    And the LDES server is available
    When I start the LDIO workflow
    And the LDES contains 1 members
    And the LDES contains 6 fragments
    Then the geo-spatial root fragment is not immutable
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the geo-spatial fragment '15/16743/11009' contains the member
    And the geo-spatial fragment '15/16744/11009' contains the member
    And the geo-spatial fragment '15/16742/11010' contains the member
    And the geo-spatial fragment '15/16743/11010' contains the member

  Scenario: 3. Multi level fragmentation
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And context 'use-cases/gtfs-and-rt/3.multi-level-fragmentation' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'six-members'
    And I have aliased the data set
    And the LDES server is available
    When I start the LDIO workflow
    And the LDES contains 6 members
    And the LDES contains 14 fragments
    Then the multi-level root fragment is not immutable
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the geo-spatial fragment '15/16743/11009' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16744/11009' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16742/11010' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16743/11010' has a second level timebased fragmentation which contains the members

  Scenario: 4. LDES Server Can Have Multiple Views
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And context 'use-cases/gtfs-and-rt/4.multi-view' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'six-members'
    And I have aliased the data set
    And the LDES server is available
    When I start the LDIO workflow
    And the LDES contains 6 members
    And the LDES contains 13 fragments
    Then the geo-spatial fragmentation exists in the mobility-hindrances LDES
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the time-based fragmentation exists
    And the timebased root fragment contains 1 relation of type 'GreaterThanOrEqualToRelation'

  Scenario: 5. Ingest GTFS/RT Including Stops
    Given the members are stored in collection 'ldesmember' in database 'bustang'
    And context 'use-cases/gtfs-and-rt/5.including-stops' is started
    And the LDIO workflow is available
    And the LDES server is available
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    And the LDES contains at least 1000 members
    Then the geo-spatial fragmentation exists in the connections LDES
    And the geo-spatial root fragment contains only relations of type 'GeospatiallyContainsRelation'
    And the first timebased second level fragment contains 1 relation of type 'GreaterThanOrEqualToRelation'
    And the first timebased second level fragment contains arrival and departure stops

  Scenario: 7. LDES Server Performance is Adequate for GTFS/RT Processing
    Given the members are stored in collection 'ldesmember' in database 'bustang'
    And I have configured the GTFS trottle rate as 200
    And context 'use-cases/gtfs-and-rt/7.direct-connect' is started
    And the LDES server is available
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    Then the LDES server can ingest 10000 linked connections within 120 seconds checking every 2 seconds
