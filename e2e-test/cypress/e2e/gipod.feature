Feature: GIPOD use case
Implements tests found at https://github.com/Informatievlaanderen/VSDS-LDES-E2E-testing/tree/main/e2e-test/use-cases/gipod

  Background: 
    Given the members are stored in collection 'ldesmember' in database 'gipod'

  Scenario: Replicate LDES
    Given context 'use-cases/gipod/1.replicate-ldes' is started
    And I have aliased the pre-seeded simulator data set
    When I start the LDIO workflow
    Then the sink contains 1016 members

  Scenario: Ingest LDES
    Given context 'use-cases/gipod/2.ingest-ldes' is started
    And I have aliased the pre-seeded simulator data set
    And the LDES server is available
    When I start the LDIO workflow
    Then the LDES contains 1016 members

  Scenario: Synchronize LDES
    Given context 'use-cases/gipod/3.synchronize-ldes' is started
    And I have uploaded the data files: 'alfa,beta'
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I start the LDIO workflow
    And the sink contains 501 members
    When I upload the data files: 'delta' with a duration of 10 seconds
    Then the sink contains 550 members
    When I upload the data files: 'epsilon' with a duration of 10 seconds
    Then the sink contains 617 members

  Scenario: Time-Fragment LDES
    Given context 'use-cases/gipod/4.time-fragment-ldes' is started
    And I have uploaded the data files: 'scenario4/alfa,scenario4/beta,scenario4/epsilon'
    And I have aliased the data set
    And the LDES server is available
    When I start the LDIO workflow
    Then the LDES contains 617 members
    And the first fragment is immutable
    And the first fragment only has a 'GreaterThanOrEqualToRelation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'LessThanOrEqualToRelation' to the first fragment
    And the middle fragment only has a 'GreaterThanOrEqualToRelation' to the last fragment
    And the last fragment is not immutable
    And the last fragment only has a 'LessThanOrEqualToRelation' to the middle fragment

  Scenario: Fragment LDES Using Simple Pagination
    Given context 'use-cases/gipod/5.paginate-ldes' is started
    And I have uploaded the data files: 'alfa,beta,gamma'
    And I have aliased the data set
    And the LDES server is available
    When I start the LDIO workflow
    Then the LDES contains 617 members
    And the first fragment is immutable
    And the first fragment only has a 'Relation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'Relation' to the first and last fragments
    And the last fragment is not immutable
    And the last fragment only has a 'Relation' to the middle fragment
