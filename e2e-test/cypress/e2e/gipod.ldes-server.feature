Feature: GIPOD use case with DB

  Scenario: Ingest LDES
    Given the ingest-ldes test is setup
    And context 'support/context/simulator-workflow-server-mongo' is started
    And I have aliased the '2.ingest-ldes' simulators pre-seeded data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '2.ingest-ldes' workflow
    When I start the workflow
    Then the MongoDB contains 1016 members

  Scenario: Time-Fragments LDES
    Given the time-fragment-ldes test is setup
    And context 'support/context/simulator-workflow-server-mongo' is started
    And I have uploaded the time-fragments data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '4.time-fragment-ldes' workflow
    And I start the workflow
    Then the MongoDB contains 617 members
    And the first fragment is immutable and links to the middle fragment
    And the middle fragment is immutable and links to the first and the last fragment
    And the last fragment is not immutable and links to the middle fragment
