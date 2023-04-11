Feature: LDES Server Caching et al.

@gipod @test-019
  Scenario Outline: 019: Verify URL Naming Strategy
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

@gipod @test-019
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

@gipod @test-019
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

@gipod @test-019
  Scenario: 019: Verify CORS and Supported HTTP Verbs
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the view from a different url 'http://example.com'
    Then the server returns the supported HTTP Verbs
    When I only request the view headers
    Then the headers include an Etag which is used for caching purposes

@gipod @test-019
  Scenario: 019: Verify Actual Caching
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the LDES
    Then the LDES is not yet cached
    When I request the LDES
    Then the LDES comes from the cache

@gipod @test-019
  Scenario: 019: Verify Nginx Compression Setup
    Given context 'tests/019.server-supports-cacheability' is started
    And the LDES server is available
    When I request the view compressed
    Then I receive a zip file containing my view

@gipod @test-019
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