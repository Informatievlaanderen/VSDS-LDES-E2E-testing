@server @retention
Feature: LDES Server Retention

  @test-012 @time-based
  Scenario: 012: Server provides timebased retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available and configured
    When I add a view with 'time-based' retention
    And I start the message generator
    Then eventually there are at least 30 members in the database
    And the member count remains around 30 for 15 seconds
    When I stop the message generator
    Then eventually there are 0 members in the database

  @test-012 @version-based
  Scenario: 012: Server provides version retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available and configured
    When I add a view with 'version-based' retention
    And I start the message generator
    Then eventually there are at least 10 members in the database
    And the member count remains around 10 for 15 seconds
    When I stop the message generator
    Then eventually the member count remains constant for 15 seconds

  @test-012 @point-in-time
  Scenario: 012: Server provides point in time retention
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available and configured
    When I add a view with 'point-in-time' retention
    And I start the message generator
    Then the member count remains around 0 for 15 seconds
    And eventually there are at least 15 members in the database
    And the member count increases for 15 seconds
    When I stop the message generator
    Then eventually the member count remains constant for 15 seconds

  @test-012 @combined @version-based @point-in-time
  Scenario: 012: Server combines multiple retention policies
    Given the members are stored in database 'gipod'
    And context 'tests/012.server-multiple-retention-policies' is started
    And the LDES server is available and configured
    When I add a view with 'version-based-and-point-in-time' retention
    And I start the message generator
    Then eventually there are at least 5 members in the database
    And the member count remains around 5 for 15 seconds
    When I stop the message generator
    And I start the second message generator
    Then eventually there are at least 10 members in the database
    And the member count remains around 10 for 15 seconds
    And eventually there are at least 25 members in the database
    And the member count increases for 15 seconds
    When I stop the second message generator
    Then eventually the member count remains constant for 15 seconds
