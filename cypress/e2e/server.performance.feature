@server @performance 
Feature: LDES Server Performance

@test-013 @gtfs
  Scenario: 013: Server Performs Fast Enough for GTFS/RT Processing
    Given the members are stored in database 'bustang'
    And I have configured the GTFS trottle rate as 200
    And context 'tests/013.server-perform-fast-enough' is started
    And the LDES server is available
    When I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    Then the LDES server can ingest 10000 linked connections within 120 seconds checking every 2 seconds
