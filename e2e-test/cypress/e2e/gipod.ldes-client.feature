Feature: GIPOD use case

  Scenario: Replicate LDES
    Given a Simulator-Workflow-Sink-Mongo context is started
    And I have aliased the simulator's pre-seeded data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '1.replicate-ldes' workflow
    When I start the workflow
    Then the sink contains 1016 members
    
  Scenario: Synchronize LDES
    Given a Simulator-Workflow-Sink-Mongo context is started
    And I have seeded the simulator with an initial data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded '3.synchronize-ldes' workflow
    And I started the workflow
    And the sync contains 501 members
    When I seed a data set update
    Then the sink contains 550 members
    When I seed another data set update
    Then the sink contains 617 members