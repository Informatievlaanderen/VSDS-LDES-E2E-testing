@server
Feature: LDES Server Basic Functionality

  @test-002 @ingestion @gipod
  Scenario Outline: 002: Server Can Ingest a Small LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/002.server-ingest-small-ldes' is started
    And I have aliased the pre-seeded simulator data set
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
    Then the LDES contains 1016 members

    @ldio
    Examples: 
      | workbench |
      | LDIO      |

    @nifi
    Examples: 
      | workbench |
      | NIFI      |

  @test-007 @ingestion @gtfs @broken
  Scenario Outline: 007: Server Can Ingest a Large LDES Using '<workbench>' Workbench
    Given the members are stored in database 'bustang'
    And context 'tests/007.server-ingest-large-ldes' is started
    And the LDES server is available and configured
    When I start the '<workbench>' workbench
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
    And the LDES server is available and configured
    When I send the member file 'data/member.ttl' of type 'text/turtle'
    Then the server accepts this member file
    When I send the member file 'data/member.nq' of type 'application/n-quads'
    Then the server accepts this member file
    When I send the member file 'data/member.jsonld' of type 'application/ld+json'
    Then the server accepts this member file
    When I send the member file 'data/member.nt' of type 'application/n-triples'
    Then the server accepts this member file

  @test-019 @consumption @naming-strategy @gipod
  Scenario Outline: 019: Verify URL Naming Strategy For Collection '<collection-name>' And View '<view-name>'
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I configure a LDES named '<collection-name>'
    And I configure a view named '<view-name>' for LDES '<collection-name>'
    Then the collection is available at '<collection-url>'
    And the view is available at '<view-url>'

    Examples: 
      | collection-name     | view-name | collection-url                            | view-url                                          |
      | mobility-hindrances | by-time   | http://localhost:8080/mobility-hindrances | http://localhost:8080/mobility-hindrances/by-time |
      | cartoons            | paged     | http://localhost:8080/cartoons            | http://localhost:8080/cartoons/paged              |

  @test-019 @consumption @formats @gipod @broken
  Scenario: 019: Verify Acceptable Fragment Formats
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available and configured
    When I request the view formatted as 'text/turtle '
    Then I receive a response similar to 'view.ttl'
    When I request the view formatted as 'application/n-quads'
    Then I receive a response similar to 'view.nq'
    When I request the view formatted as 'application/ld+json'
    Then I receive a response similar to 'view.json'
    When I request the view formatted as 'application/n-triples'
    Then I receive a response similar to 'view.nt'
    When I send the member file 'data/member.ttl' of type 'text/turtle'
    And I request the view formatted as 'application/n-triples'
    Then the first page is a subset of the collection

  @test-019 @consumption @cors @gipod
  Scenario: 019: Verify CORS and Supported HTTP Verbs
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available and configured
    When I request the view from a different url 'http://example.com'
    Then the server returns the supported HTTP Verbs
    When I only request the view headers
    Then the headers include an Etag which is used for caching purposes

  @test-019 @consumption @cacheability @gipod
  Scenario: 019: Verify Actual Caching
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available and configured
    When I request the LDES
    Then the LDES is not yet cached
    When I request the LDES
    Then the LDES comes from the cache

  @test-019 @consumption @compression @gipod
  Scenario: 019: Verify Nginx Compression Setup
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available and configured
    When I request the view compressed
    Then I receive a zip file containing my view

  @test-019 @consumption @caching
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

  @test-027 @ingestion @sequencing @iow @grar
  Scenario: 027: LDES Server Imposes An Ingest Order Per Collection
    Given the members are stored in database 'test'
    And context 'tests/027.server-generates-member-sequence' is started
    And the LDES server is available and configured
    When I ingest 10 'mobility-hindrances'
    And I ingest 5 'addresses'
    Then the 'mobility-hindrances' LDES contains 10 members
    And the 'addresses' LDES contains 5 members
    And all 10 'mobility-hindrances' have a unique sequence number
    And all 5 'addresses' have a unique sequence number

  @test-030 @multi-collection @iow
  Scenario Outline: 030: Server Supports Multi LDES Using '<workbench>' Workbench
    Given the members are stored in database 'iow'
    And context 'tests/030.server-allow-multi-collection' is started
    And the LDES server is available and configured
    And I start the '<workbench>' workbench
    When I upload the data file 'device-model' to the workbench
    And the LDES contains 1 members
    Then the 'device-models' 'by-page' fragment contains 1 members
    When I upload the data file 'device' to the workbench
    And the LDES contains 2 members
    Then the 'devices' 'by-page' fragment contains 1 members
    When I start the JSON Data Generator
    And the LDES contains at least 3 members
    Then the 'water-quality-observations' 'by-page' fragment contains at least 3 members

    @nifi
    Examples: 
      | workbench |
      | NIFI      |

    @ldio
    Examples: 
      | workbench |
      | LDIO      |
