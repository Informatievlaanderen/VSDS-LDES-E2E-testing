Feature: GTFS/RT use case

  Scenario: Geo fragmentation
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
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the geo-spatial fragment '15/16743/11009' contains the member
    And the geo-spatial fragment '15/16744/11009' contains the member
    And the geo-spatial fragment '15/16742/11010' contains the member
    And the geo-spatial fragment '15/16743/11010' contains the member

  Scenario: Multi level fragmentation
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And the 'use-cases/gtfs-and-rt/3.multi-level-fragmentation' test is setup
    And context 'use-cases/gtfs-and-rt/3.multi-level-fragmentation' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'six-members'
    And I have aliased the data set
    And the LDES server is available
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    Then the LDES contains 6 members
    And the multi-level root fragment is not immutable
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the geo-spatial fragment '15/16743/11009' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16744/11009' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16742/11010' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16743/11010' has a second level timebased fragmentation which contains the members

  Scenario: LDES Server Can Have Multiple Views
    Given the members are stored in collection 'ldesmember' in database 'gipod'
    And the 'use-cases/gtfs-and-rt/4.multi-view' test is setup
    And context 'use-cases/gtfs-and-rt/4.multi-view' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'six-members'
    And I have aliased the data set
    And the LDES server is available
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    Then the LDES contains 6 members
    And the first view url is not undefined
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the second view url is not undefined
    And the timebased root fragment contains 1 relation of type 'GreaterThanOrEqualToRelation'
