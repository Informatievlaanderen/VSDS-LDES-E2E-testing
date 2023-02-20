Feature: LDES Server Caching et al.

  Scenario Outline: Verify URL Naming Strategy
    Given I have configured the 'COLLECTION_NAME' as '<collection-name>'
    And I have configured the 'VIEW_NAME' as '<view-name>'
    When the 'demos/ldes-server-caching' test is setup
    And context 'demos/ldes-server-caching' is started
    Then the collection is available at '<collection-url>'
    And the view is available at '<view-url>'

    Examples: 
      | collection-name     | view-name | collection-url                            | view-url                                          |
      | mobility-hindrances | by-time   | http://localhost:8080/mobility-hindrances | http://localhost:8080/mobility-hindrances/by-time |
      | cartoons            | by-page   | http://localhost:8080/cartoons            | http://localhost:8080/cartoons/by-page            |

  Scenario: Verify Acceptable Fragment Formats
    Given the 'demos/ldes-server-caching' test is setup
    And context 'demos/ldes-server-caching' is started
    When I request the view formatted as 'text/turtle '
    Then I receive a response similar to 'view.ttl'
    When I request the view formatted as 'application/n-quads'
    Then I receive a response similar to 'view.nq'
    When I request the view formatted as 'application/ld+json'
    Then I receive a response similar to 'view.json'
    When I request the view formatted as 'application/n-triples'
    Then I receive a response similar to 'view.nt'
