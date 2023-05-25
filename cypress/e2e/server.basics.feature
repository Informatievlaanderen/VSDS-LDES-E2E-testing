@server 
Feature: LDES Server Basic Functionality

@test-002 @ingestion @gipod
  Scenario Outline: 002: Server Can Ingest a Small LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/002.server-ingest-small-ldes' is started
    And I have aliased the pre-seeded simulator data set
    And the LDES server is available
    When I start the '<workbench>' workflow
    Then the LDES contains 1016 members

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-007 @ingestion @gtfs
  Scenario Outline: 007: Server Can Ingest a Large LDES Using '<workbench>' Workbench
    Given the members are stored in database 'bustang'
    And I have configured the 'VIEWS_0_FRAGMENTATIONS_0_CONFIG_MEMBERLIMIT' as '250'
    And context 'tests/007.server-ingest-large-ldes' is started
    And the LDES server is available
    When I start the '<workbench>' workflow
    And I start the GTFS2LDES service
    And the GTFS to LDES service starts sending linked connections
    And the LDES contains at least 250 members
    Then the pagination fragmentation exists in the connections LDES
    And the first page contains 250 members

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |

@test-019 @ingestion @formats @gipod
  Scenario: 019: Verify Acceptable Member Formats
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I send the member file 'data/member.ttl' of type 'text/turtle'
    Then the server accepts this member file
    When I send the member file 'data/member.nq' of type 'application/n-quads'
    Then the server accepts this member file
    When I send the member file 'data/member.jsonld' of type 'application/ld+json'
    Then the server accepts this member file
    When I send the member file 'data/member.nt' of type 'application/n-triples'
    Then the server accepts this member file

@test-019 @consumption @gipod
  Scenario Outline: 019: Verify URL Naming Strategy For Collection '<collection-name>' And View '<view-name>'
    Given I have configured the 'COLLECTION_NAME' as '<collection-name>'
    And I have configured the 'VIEW_NAME' as '<view-name>'
    When context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    Then the collection is available at '<collection-url>'
    And the view is available at '<view-url>'

    Examples: 
      | collection-name     | view-name | collection-url                            | view-url                                          |
      | mobility-hindrances | by-time   | http://localhost:8080/mobility-hindrances | http://localhost:8080/mobility-hindrances/by-time |
      | cartoons            | by-page   | http://localhost:8080/cartoons            | http://localhost:8080/cartoons/by-page            |

@test-019 @consumption @gipod
  Scenario: 019: Verify Acceptable Fragment Formats
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the view formatted as 'text/turtle '
    Then I receive a response similar to 'view.ttl'
    When I request the view formatted as 'application/n-quads'
    Then I receive a response similar to 'view.nq'
    When I request the view formatted as 'application/ld+json'
    Then I receive a response similar to 'view.json'
    When I request the view formatted as 'application/n-triples'
    Then I receive a response similar to 'view.nt'

@test-019 @consumption @gipod
  Scenario: 019: Verify CORS and Supported HTTP Verbs
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the view from a different url 'http://example.com'
    Then the server returns the supported HTTP Verbs
    When I only request the view headers
    Then the headers include an Etag which is used for caching purposes

@test-019 @consumption @cacheability @gipod
  Scenario: 019: Verify Actual Caching
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the LDES
    Then the LDES is not yet cached
    When I request the LDES
    Then the LDES comes from the cache

@test-019 @consumption @compression @gipod
  Scenario: 019: Verify Nginx Compression Setup
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the view compressed
    Then I receive a zip file containing my view

@test-019 @consumption @caching @gipod
  Scenario: 019: Verify Nginx Caching Responses
    Given I have configured the 'MAX_AGE' as '10'
    And context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the LDES view
    Then the LDES is not yet cached
    When I request the LDES view
    Then the LDES comes from the cache
    When I wait 10 seconds for the cache to expire
    And  I request the LDES view
    Then the LDES is re-requested from the LDES server
