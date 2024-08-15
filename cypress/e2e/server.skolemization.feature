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
    When I upload the LDIO 'client-pipeline'
    Then the repository sink contains both members
    When I retrieve the skolem IDs for both members
    And I upload the members in 'data/members.update.ttl' to the server in collection 'observations'
    Then the repository sink contains the updated member
    When I retrieve the skolem IDs for both members again
    Then the skolem IDs for the first member are updated
    And the skolem IDs for the second member are unchanged
    And I tear down the context
