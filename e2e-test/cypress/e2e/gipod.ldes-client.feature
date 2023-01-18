Feature: GIPOD use case

  Scenario: Replicate LDES
    Given a Simulator-Workflow-Sink-Mongo context is started
    And I have aliased the simulator's pre-seeded data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded a workflow with an LDES client
    When I start the workflow
    Then the sink contains the correct number of members (1016)
    
  Scenario: Synchronize LDES
    Given a Simulator-Workflow-Sink-Mongo context is started
    And I have seeded the simulator with an initial data set
    And I have logged on to the Apache NiFi UI
    And I have uploaded a workflow with an LDES client
    And I started the workflow
    And the last fragment is being re-requested
    When I seed a data set update
    Then the sink contains the correct number of members (617)
