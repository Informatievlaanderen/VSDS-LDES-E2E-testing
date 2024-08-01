@client @basics
Feature: LDES Client Basic Functionality

  @test-001 @replicate @parkAndRide @ldio
  Scenario: 001: Client Can Replicate an LDES Using LDIO Workbench
    Given I have setup context 'tests/001.client-replicate-ldes'
    And I have seeded and aliased the 'parkAndRide' simulator data set
    When I upload the LDIO 'client-pipeline'
    Then the sink contains 1016 members in collection 'parkAndRide'
    And I tear down the context


  @test-003 @synchronize @parkAndRide @ldio
  Scenario: 003: Client Can Synchronize an LDES Using LDIO Workbench
    Given I have setup context 'tests/003.client-synchronize-ldes'
    When I upload the simulator file: 'delta' with a duration of 10 seconds
    Then the sink contains 550 members in collection 'parkAndRide'
    When I upload the simulator file: 'epsilon' with a duration of 10 seconds
    Then the sink contains 617 members in collection 'parkAndRide'
    And I tear down the context


  @test-018 @cli @ldio @parkAndRide
  Scenario: 018: Client Can Output LDES members to the Console
    Given I have setup context 'tests/018.client-output-to-console'
    When I upload the LDIO 'client-pipeline'
    Then the client console contains 1 members
    When I upload the simulator file: 'delta'
    Then the client console contains 50 members
    And I tear down the context
