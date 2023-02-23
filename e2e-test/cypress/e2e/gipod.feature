Feature: GIPOD use case

  Background:
    Given the members are stored in collection 'ldesmember' in database 'gipod'

  Scenario: Replicate LDES
    Given the 'use-cases/gipod/1.replicate-ldes' test is setup
    And context 'support/context/simulator-workflow-sink-mongo' is started
    And I have aliased the pre-seeded simulator data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    Then the sink contains 1016 members

  Scenario: Ingest LDES
    Given the 'use-cases/gipod/2.ingest-ldes' test is setup
    And context 'support/context/simulator-workflow-server-mongo' is started
    And I have aliased the pre-seeded simulator data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    Then the LDES contains 1016 members
    
  Scenario: Synchronize LDES
    Given the 'use-cases/gipod/3.synchronize-ldes' test is setup
    And context 'support/context/simulator-workflow-sink-mongo' is started
    And I have uploaded the data files: 'alfa,beta'
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    When I start the workflow
    And the sink contains 501 members
    When I upload the data files: 'delta' with a duration of 10 seconds
    Then the sink contains 550 members
    When I upload the data files: 'epsilon' with a duration of 10 seconds
    Then the sink contains 617 members

  Scenario: Time-Fragment LDES
    Given the 'use-cases/gipod/4.time-fragment-ldes' test is setup
    And context 'support/context/simulator-workflow-server-mongo' is started
    And I have uploaded the data files: 'scenario4/alfa,scenario4/beta,scenario4/epsilon'
    And I have aliased the data set    
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    And the server is available
    When I start the workflow
    Then the LDES contains 617 members
    And the first fragment is immutable
    And the first fragment only has a 'GreaterThanOrEqualToRelation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'LessThanOrEqualToRelation' to the first fragment
    And the middle fragment only has a 'GreaterThanOrEqualToRelation' to the last fragment
    And the last fragment is not immutable
    And the last fragment only has a 'LessThanOrEqualToRelation' to the middle fragment

  Scenario: Fragment LDES Using Simple Pagination
    Given the 'use-cases/gipod/5.paginate-ldes' test is setup
    And context 'use-cases/gipod/5.paginate-ldes' is started
    And I have uploaded the data files: 'alfa,beta,gamma'
    And I have aliased the data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded the workflow
    And the server is available
    When I start the workflow
    Then the LDES contains 617 members
    And the first fragment is immutable
    And the first fragment only has a 'Relation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'Relation' to the first and last fragments
    And the last fragment is not immutable
    And the last fragment only has a 'Relation' to the middle fragment
