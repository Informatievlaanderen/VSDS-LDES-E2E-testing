@server
Feature: LDES Server Basic Functionality

  @test-007 @ingestion @smoke @large @gtfs
  Scenario Outline: 007: Server Can Ingest a Large LDES Using '<workbench>' Workbench
    Given the members are stored in database 'bustang'
    And context 'tests/007.server-ingest-large-ldes' is started
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    And I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    And the LDES contains at least 250 members
    Then the connections LDES is paginated
    And the first page contains 250 members

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

  @test-019 @consumption @cacheability @parkAndRide
  Scenario: 019: Verify Actual Caching
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available and configured
    When I request the LDES
    Then the LDES is not yet cached
    When I request the LDES
    Then the LDES comes from the cache

  @test-019 @consumption @compression @parkAndRide
  Scenario: 019: Verify Nginx Compression Setup
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available and configured
    When I request the view compressed
    Then I receive a zip file containing my view

  @test-019 @consumption @caching @parkAndRide
  Scenario: 019: Verify Nginx Caching Responses
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available and configured
    When I request the LDES view
    Then the LDES view is not yet cached
    When I request the LDES view
    Then the LDES view comes from the cache
    When I wait 10 seconds for the cache to expire
    And I request the LDES view
    Then the LDES view is re-requested from the LDES server

  @test-035 @consumption @relativeUrls
  Scenario: 035: Verify server and client can handle relative url
    Given the members are stored in database 'bustang'
    And context 'tests/035.relative-urls' is started
    And the LDES server is available and configured
    When I start the LDES Client 'LDIO' workbench
    Then the sink contains 5 members