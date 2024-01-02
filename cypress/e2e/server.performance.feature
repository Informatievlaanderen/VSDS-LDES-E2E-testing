@server @performance
Feature: LDES Server Performance

  @test-013 @gtfs @broken
  Scenario: 013: Server Performs Fast Enough for GTFS/RT Processing
    Given the members are stored in database 'bustang'
    And I have configured the GTFS trottle rate as 200
    And context 'tests/013.server-perform-fast-enough' is started
    And the LDES server is available and configured
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    Then the LDES server ingests linked connections for 120 seconds without lagging behind more than the throttle rate
    And the LDES server ingests linked connections in average at least at 50 members per second