@server @retention
Feature: LDES Server Retention

@test-012
  Scenario: 012: Server provides timebased retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available
    And I seed the LDES server with a collection
    And I start the message generator
    And I remove the 'by-page' view from the 'mobility-hindrances' collection
    When I add a view with timebased retention to the LDES server
    And I wait for 30 seconds
    Then The member count remains between 30 and 40
    When I stop the message generator
    And I wait for 40 seconds
    Then the LDES should contain 0 members

  @test-012
  Scenario: 012: Server provides version retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available
    And I seed the LDES server with a collection
    And I start the message generator
    And I remove the 'by-page' view from the 'mobility-hindrances' collection
    When I add a view with versionbased retention to the LDES server
    And I wait for 30 seconds
    Then The member count remains between 10 and 20
    When I stop the message generator
    And I wait for 40 seconds
    Then The member count is between 10 and 20

  @test-012
  Scenario: 012: Server provides point in time retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available
    And I seed the LDES server with a collection
    And I start the message generator
    And I remove the 'by-page' view from the 'mobility-hindrances' collection
    When I add a view with point in time retention to the LDES server
    And I wait for 5 seconds
    Then The member count remains between 0 and 10
    When I wait for 30 seconds
    Then The member count is increasing
    When I stop the message generator
    And I wait for 30 seconds
    Then The member count is higher than 0

  @test-012
  Scenario: 012: Server combines multiple retention policies
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available
    And I seed the LDES server with a collection
    And I start the message generator
    And I remove the 'by-page' view from the 'mobility-hindrances' collection
    When I add a view with multiple retention policies to the LDES server
    And I wait for 10 seconds
    Then The member count remains between 5 and 15
    When I stop the message generator
    And I start the second message generator
    And I wait for 10 seconds
    Then The member count remains between 10 and 20
    When I wait for 40 seconds
    Then The member count is increasing
    When I stop the second message generator
    And I wait for 10 seconds
    Then The member count is higher than 0

