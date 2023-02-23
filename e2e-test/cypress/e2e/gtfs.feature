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

  @focus
  Scenario: LDES Server Offers Multiple Views
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
    And the multi-view root fragment is not immutable
    And the multi-view root fragment contains multiple relations of type 'GeospatiallyContainsRelation'


# aangeven dat er multi level fragmentation is
# level 0 = geospatial
# expect member array is leeg en we verwachten 1 relatie van type tree:relation en die link volgen, daarin zitten de members (member array is niet leeg)
# level 1 = timebased