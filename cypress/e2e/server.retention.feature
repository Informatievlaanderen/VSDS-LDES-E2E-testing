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
    And I wait until there are 30 members in the database
    Then The member count remains around 30
    When I stop the message generator
    And I wait until there are 0 members in the database

  @test-012
  Scenario: 012: Server provides version retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available
    And I seed the LDES server with a collection
    And I start the message generator
    And I remove the 'by-page' view from the 'mobility-hindrances' collection
    When I add a view with versionbased retention to the LDES server
    And I wait until there are 10 members in the database
    Then The member count remains around 10
    When I stop the message generator
    Then The member count remains constant

  @test-012
  Scenario: 012: Server provides point in time retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available
    And I seed the LDES server with a collection
    And I start the message generator
    And I remove the 'by-page' view from the 'mobility-hindrances' collection
    When I add a view with point in time retention to the LDES server
    Then The member count remains around 0
    When I wait until there are 15 members in the database
    Then The member count is increasing
    When I stop the message generator
    Then The member count remains constant

  @test-012
  Scenario: 012: Server combines multiple retention policies
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available
    And I seed the LDES server with a collection
    And I start the message generator
    And I remove the 'by-page' view from the 'mobility-hindrances' collection
    When I add a view with multiple retention policies to the LDES server
    And I wait until there are 5 members in the database
    Then The member count remains around 5
    When I stop the message generator
    And I start the second message generator
    And I wait until there are 10 members in the database
    Then The member count remains around 10
    When I wait until there are 25 members in the database
    Then The member count is increasing
    When I stop the second message generator
    Then The member count remains constant

