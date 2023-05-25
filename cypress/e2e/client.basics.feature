Feature: LDES Client Basic Functionality

@test-001 @client @replicate @gipod 
  Scenario Outline: 001: Client Can Replicate an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/001.client-replicate-ldes' is started
    And I have aliased the pre-seeded simulator data set
    When I start the '<workbench>' workflow
    Then the sink contains 1016 members

    Examples:
      | workbench |
      | LDIO      |
      | NIFI      |

@test-003 @client @synchronize @gipod 
  Scenario Outline: 003: Client Can Synchronize an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/003.client-synchronize-ldes' is started
    And I have uploaded the data files: 'alfa,beta'
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I start the '<workbench>' workflow
    And the sink contains 501 members
    When I upload the data files: 'delta' with a duration of 10 seconds
    Then the sink contains 550 members
    When I upload the data files: 'epsilon' with a duration of 10 seconds
    Then the sink contains 617 members

    Examples:
      | workbench |
      | LDIO      |
      | NIFI      |

@test-018 @client @cli @gipod 
  # Replicate and Synchronize an LDES with Client CLI
  Scenario: 018: Client Can Output LDES members to the Console
    Given the members are stored in database 'gipod'
    And context 'tests/018.client-output-to-console' is started
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I launch the Client CLI
    Then the Client CLI contains 1 members
    When I have uploaded the data files: 'delta'
    Then the Client CLI contains 50 members
