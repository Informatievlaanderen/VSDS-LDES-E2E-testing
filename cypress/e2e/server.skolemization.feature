@server @skolemization
Feature: LDES Server Skolemization Functionality

  @test-040
  Scenario: 040: Server Replaces Blank Nodes if Skolemization Domain is Configured
    Given I have setup context 'tests/040.skolemization'
    When I upload the members in 'data/members.ttl' to the server in collection 'observations'
    And the 2 members are available in the first fragment
    Then all subjects in both members are named nodes
    And no object in any member is a blank node
    And all skolem objects are unique
    And I tear down the context
