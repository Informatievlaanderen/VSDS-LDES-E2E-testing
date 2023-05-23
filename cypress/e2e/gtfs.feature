Feature: GTFS/RT use case

@gtfs @test-007
  Scenario: 007: Server Can Ingest a Large LDES
    Given the members are stored in collection 'ldesmember' in database 'bustang'
    And I have configured the 'VIEWS_0_FRAGMENTATIONS_0_CONFIG_MEMBERLIMIT' as '250'
    And context 'tests/007.server-ingest-large-ldes' is started
    And the LDIO workflow is available
    And the LDES server is available
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    And the LDES contains at least 250 members
    Then the pagination fragmentation exists in the connections LDES
    And the first page contains 250 members

@gtfs @test-008
  Scenario: 008: Server Can Geospatially Fragment a Small LDES
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And context 'tests/008.server-geo-fragment-small-ldes' is started
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

@gtfs @test-009
  Scenario: 009: Server Can Multi-level Fragment an LDES
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And context 'tests/009.server-multi-level-fragment-ldes' is started
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

@gtfs @test-010
  Scenario: 010: Server Allows Multiple Views in an LDES
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And context 'tests/010.server-allow-multi-view-ldes' is started
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

@gtfs @test-011
  Scenario: 011: Server Can Geospatially Fragment a Large LDES
    Given the members are stored in collection 'ldesmember' in database 'bustang'
    And context 'tests/011.server-geo-fragment-large-ldes' is started
    And the LDIO workflow is available
    And the LDES server is available
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    And the LDES contains at least 1000 members
    And the LDES contains at least 3 fragments
    Then the geo-spatial fragmentation exists in the connections LDES
    And the geo-spatial root fragment contains only relations of type 'GeospatiallyContainsRelation'
    And the first timebased second level fragment contains 1 relation of type 'GreaterThanOrEqualToRelation'
    And the first timebased second level fragment contains arrival and departure stops

@gtfs @test-013
  Scenario: 013: Server Performs Fast Enough for GTFS/RT Processing
    Given the members are stored in collection 'ldesmember' in database 'bustang'
    And I have configured the GTFS trottle rate as 200
    And context 'tests/013.server-perform-fast-enough' is started
    And the LDES server is available
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    Then the LDES server can ingest 10000 linked connections within 120 seconds checking every 2 seconds
