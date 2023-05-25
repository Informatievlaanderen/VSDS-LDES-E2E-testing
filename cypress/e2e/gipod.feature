Feature: GIPOD use case

@gipod @test-001
  Scenario Outline: 001: Client Can Replicate an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/001.client-replicate-ldes' is started
    And I have aliased the pre-seeded simulator data set
    When I start the '<workbench>' workflow
    Then the sink contains 1016 members

    Examples:
      | workbench |
      | LDIO      |
      | NIFI      |

@gipod @test-002
  Scenario Outline: 002: Server Can Ingest a Small LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/002.server-ingest-small-ldes' is started
    And I have aliased the pre-seeded simulator data set
    And the LDES server is available
    When I start the '<workbench>' workflow
    Then the LDES contains 1016 members

    Examples:
      | workbench |
      | LDIO      |
      | NIFI      |

@gipod @test-003
  Scenario Outline: 003: Client Can Synchronize an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/003.client-synchronize-ldes' is started
    And I have uploaded the data files: 'alfa,beta'
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I start the '<workbench>' workflow
    And the sink contains 501 members
    When I upload the data files: 'delta' with a duration of 10 seconds
    Then the sink contains 550 members
    When I upload the data files: 'epsilon' with a duration of 10 seconds
    Then the sink contains 617 members

    Examples:
      | workbench |
      | LDIO      |
      | NIFI      |

@gipod @test-004
  Scenario Outline: 004: Server Can Time-Fragment an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/004.server-time-fragment-ldes' is started
    And I have uploaded the data files: 'alfa,beta,epsilon'
    And I have aliased the data set
    And the LDES server is available
    When I start the '<workbench>' workflow
    And the LDES contains 617 members
    Then the first fragment is immutable
    And the first fragment only has a 'GreaterThanOrEqualToRelation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'LessThanOrEqualToRelation' to the first fragment
    And the middle fragment only has a 'GreaterThanOrEqualToRelation' to the last fragment
    And the last fragment is not immutable
    And the last fragment only has a 'LessThanOrEqualToRelation' to the middle fragment

    Examples:
      | workbench |
      | LDIO      |
      | NIFI      |

@gipod @test-005
  Scenario Outline: 005: Server Can Paginate an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/005.server-paginate-ldes' is started
    And I have uploaded the data files: 'alfa,beta,gamma'
    And I have aliased the data set
    And the LDES server is available
    When I start the '<workbench>' workflow
    And the LDES contains 617 members
    Then the first fragment is immutable
    And the first fragment only has a 'Relation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'Relation' to the first and last fragments
    And the last fragment is not immutable
    And the last fragment only has a 'Relation' to the middle fragment

    Examples:
      | workbench |
      | LDIO      |
      | NIFI      |

@gipod @test-018
  # Replicate and Synchronize an LDES with Client CLI
  Scenario: 018: Client Can Output LDES members to the Console
    Given the members are stored in database 'gipod'
    And context 'tests/018.client-output-to-console' is started
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I launch the Client CLI
    Then the Client CLI contains 1 members
    When I have uploaded the data files: 'delta'
    Then the Client CLI contains 50 members
    