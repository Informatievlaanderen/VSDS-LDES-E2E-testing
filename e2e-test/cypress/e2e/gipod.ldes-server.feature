Feature: GIPOD use case (Server tests)

  Scenario: Ingest LDES
    Given the ingest-ldes test is setup
    And context 'support/context/simulator-workflow-server-mongo' is started
    And I have aliased the '2.ingest-ldes' simulators pre-seeded data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '2.ingest-ldes' workflow
    When I start the workflow
    Then the LDES contains 1016 members

  Scenario: Time-Fragment LDES
    Given the time-fragment-ldes test is setup
    And context 'support/context/simulator-workflow-server-mongo' is started
    And I have uploaded the time-fragments data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '4.time-fragment-ldes' workflow
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
    Given the paginate-ldes test is setup
    And context 'use-cases/gipod/5.paginate-ldes' is started
    And I have uploaded the paginate-ldes data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '5.paginate-ldes' workflow
    When I start the workflow
    Then the LDES contains 617 members
    And the first fragment is immutable
    And the first fragment only has a 'Relation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'Relation' to the first and last fragments
    And the last fragment is not immutable
    And the last fragment only has a 'Relation' to the middle fragment
