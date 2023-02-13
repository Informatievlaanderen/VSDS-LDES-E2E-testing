Feature: GIPOD use case (client tests)

  Background: 
    Given context 'support/context/simulator-workflow-sink-mongo' is started

  Scenario: Replicate LDES
    Given I have aliased the '1.replicate-ldes' simulators pre-seeded data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '1.replicate-ldes' workflow
    When I start the workflow
    Then the sink contains 1016 members
    
  Scenario: Synchronize LDES
    Given I have seeded the simulator with an initial data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '3.synchronize-ldes' workflow
    When I start the workflow
    And the sink contains 501 members
    When I seed a data set update
    Then the sink contains 550 members
    When I seed another data set update
    Then the sink contains 617 members