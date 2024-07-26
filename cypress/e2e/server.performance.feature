@server @performance
Feature: LDES Server Performance

  @test-013 @gtfs @BROKEN
  Scenario: 013: Server Performs Fast Enough for GTFS/RT Processing
    Given the members are stored in database 'gtfs-performance'
    And context 'tests/013.server-perform-fast-enough' is started
    And the LDES server is available and configured
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    Then the LDES server ingests linked connections for 120 seconds
    And the LDES server ingests linked connections in average at least at 200 members per second