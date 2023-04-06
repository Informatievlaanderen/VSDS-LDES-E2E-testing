Feature: GIPOD use case

  Background: 
    Given the members are stored in collection 'ldesmember' in database 'gipod'

@gipod @test-001
  Scenario: 001: Client Can Replicate an LDES
    Given context 'tests/001.client-replicate-ldes' is started
    And I have aliased the pre-seeded simulator data set
    When I start the LDIO workflow
    Then the sink contains 1016 members

@gipod @test-002
  Scenario: 002: Server Can Ingest a Small LDES
    Given context 'tests/002.server-ingest-small-ldes' is started
    And I have aliased the pre-seeded simulator data set
    And the LDES server is available
    When I start the LDIO workflow
    Then the LDES contains 1016 members

@gipod @test-003
  Scenario: 003: Client Can Synchronize an LDES
    Given context 'tests/003.client-synchronize-ldes' is started
    And I have uploaded the data files: 'alfa,beta'
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I start the LDIO workflow
    And the sink contains 501 members
    When I upload the data files: 'delta' with a duration of 10 seconds
    Then the sink contains 550 members
    When I upload the data files: 'epsilon' with a duration of 10 seconds
    Then the sink contains 617 members

@gipod @test-004
  Scenario: 004: Server Can Time-Fragment an LDES
    Given context 'tests/004.server-time-fragment-ldes' is started
    And I have uploaded the data files: 'alfa,beta,epsilon'
    And I have aliased the data set
    And the LDES server is available
    When I start the LDIO workflow
    And the LDES contains 617 members
    Then the first fragment is immutable
    And the first fragment only has a 'GreaterThanOrEqualToRelation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'LessThanOrEqualToRelation' to the first fragment
    And the middle fragment only has a 'GreaterThanOrEqualToRelation' to the last fragment
    And the last fragment is not immutable
    And the last fragment only has a 'LessThanOrEqualToRelation' to the middle fragment

@gipod @test-005
  Scenario: 005: Server Can Paginate an LDES
    Given context 'tests/005.server-paginate-ldes' is started
    And I have uploaded the data files: 'alfa,beta,gamma'
    And I have aliased the data set
    And the LDES server is available
    When I start the LDIO workflow
    And the LDES contains 617 members
    Then the first fragment is immutable
    And the first fragment only has a 'Relation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'Relation' to the first and last fragments
    And the last fragment is not immutable
    And the last fragment only has a 'Relation' to the middle fragment
