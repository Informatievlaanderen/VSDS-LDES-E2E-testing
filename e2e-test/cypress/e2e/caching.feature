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
