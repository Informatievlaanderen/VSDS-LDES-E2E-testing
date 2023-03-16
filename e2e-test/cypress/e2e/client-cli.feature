Feature: LDES Client Command Line Interface (CLI) can Replicate and Synchronize an LDES

  Scenario: Replicate and Synchronize an LDES with Client CLI
    Given the 'demos/ldes-client-cli' test is setup
    And context 'demos/ldes-client-cli' is started
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set

    When I launch the Client CLI
    Then the Client CLI contains 1 members

    When I have uploaded the data files: 'delta'
    Then the Client CLI contains 50 members
