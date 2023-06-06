@server @fragmentation
Feature: LDES Server Fragmentation

@test-004 @time @gipod
  Scenario Outline: 004: Server Can Time-Fragment an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/004.server-time-fragment-ldes' is started
    And I have uploaded the data files: 'alfa,beta,epsilon'
    And I have aliased the data set
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And the LDES contains 617 members
    Then the first fragment is immutable
    And the first fragment only has a 'GreaterThanOrEqualToRelation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'LessThanOrEqualToRelation' to the first fragment
    And the middle fragment only has a 'GreaterThanOrEqualToRelation' to the last fragment
    And the last fragment is not immutable
    And the last fragment only has a 'LessThanOrEqualToRelation' to the middle fragment

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-005 @partition @gipod
  Scenario Outline: 005: Server Can Paginate an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/005.server-paginate-ldes' is started
    And I have uploaded the data files: 'alfa,beta,gamma'
    And I have aliased the data set
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And the LDES contains 617 members
    Then the first fragment is immutable
    And the first fragment only has a 'Relation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'Relation' to the first and last fragments
    And the last fragment is not immutable
    And the last fragment only has a 'Relation' to the middle fragment

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-006 @substring @grar
  Scenario Outline: 006: Server Can Substring Fragment an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'grar'
    And context 'tests/006.server-substring-fragment-ldes' is started
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And I start the JSON Data Generator
    And the LDES contains at least 13 members
    Then the substring root fragment is not immutable
    And the root fragment contains 'SubstringRelation' relations with values: 'k,1,9,l,g,h,2'
    When the LDES contains at least 73 members
    Then the fragment exists for substring 'ka,ho,gr'

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-008 @geospatial @gipod
  Scenario Outline: 008: Server Can Geospatially Fragment a Small LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/008.server-geo-fragment-small-ldes' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'one-member'
    And I have aliased the data set
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And the LDES contains 1 members
    And the LDES contains 6 fragments
    Then the geo-spatial root fragment is not immutable
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the geo-spatial fragment '15/16743/11009' contains the member
    And the geo-spatial fragment '15/16744/11009' contains the member
    And the geo-spatial fragment '15/16742/11010' contains the member
    And the geo-spatial fragment '15/16743/11010' contains the member

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-009 @multi-level @gipod @github-704
  Scenario Outline: 009: Server Can Multi-level Fragment an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/009.server-multi-level-fragment-ldes' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'six-members'
    And I have aliased the data set
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And the LDES contains 6 members
    And the LDES contains 14 fragments
    Then the multi-level root fragment is not immutable
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the geo-spatial fragment '15/16743/11009' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16744/11009' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16742/11010' has a second level timebased fragmentation which contains the members
    And the geo-spatial fragment '15/16743/11010' has a second level timebased fragmentation which contains the members

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-010 @multi-view @gipod
  Scenario Outline: 010: Server Allows Multiple Views in an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/010.server-allow-multi-view-ldes' is started
    And the LDES Server Simulator is available
    And I have uploaded the data files: 'six-members'
    And I have aliased the data set
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And the LDES contains 6 members
    And the LDES contains 9 fragments
    Then the geo-spatial fragmentation exists in the mobility-hindrances LDES
    And the geo-spatial root fragment contains 4 relations of type 'GeospatiallyContainsRelation'
    And the time-based fragmentation exists
    And the timebased root fragment contains 1 relation of type 'GreaterThanOrEqualToRelation'

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-011 @geospatial @gtfs @github-704
  Scenario Outline: 011: Server Can Geospatially Fragment a Large LDES Using '<workbench>' Workbench
    Given the members are stored in database 'bustang'
    And context 'tests/011.server-geo-fragment-large-ldes' is started
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    And the LDES contains at least 1000 members
    And the LDES contains at least 3 fragments
    Then the geo-spatial fragmentation exists in the connections LDES
    And the geo-spatial root fragment contains only relations of type 'GeospatiallyContainsRelation'
    And the first timebased second level fragment contains 1 relation of type 'GreaterThanOrEqualToRelation'
    And the first timebased second level fragment contains arrival and departure stops

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |
