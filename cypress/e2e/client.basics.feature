@client @basics
Feature: LDES Client Basic Functionality

  @test-001 @replicate @parkAndRide
  Scenario Outline: 001: Client Can Replicate an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'Gent'
    And context 'tests/001.client-replicate-ldes' is started
    And I have aliased the 'parkAndRide' simulator data set
    When I start the LDES Client '<workbench>' workbench
    Then the sink contains 1016 members in collection 'parkAndRide'

    @ldio
    Examples: 
      | workbench |
      | LDIO      |

    @nifi
    Examples: 
      | workbench |
      | NIFI      |

  @test-003 @synchronize @parkAndRide
  Scenario Outline: 003: Client Can Synchronize an LDES Using '<workbench>' Workbench
    Given the members are stored in database 'Gent'
    And context 'tests/003.client-synchronize-ldes' is started
    And I have uploaded the data files: 'alfa,beta'
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I start the LDES Client '<workbench>' workbench
    And the sink contains 501 members in collection 'parkAndRide'
    When I upload the data files: 'delta' with a duration of 10 seconds
    Then the sink contains 550 members in collection 'parkAndRide'
    When I upload the data files: 'epsilon' with a duration of 10 seconds
    Then the sink contains 617 members in collection 'parkAndRide'

    @ldio
    Examples: 
      | workbench |
      | LDIO      |

    @nifi
    Examples: 
      | workbench |
      | NIFI      |

  @test-018 @cli @ldio @parkAndRide
  Scenario: 018: Client Can Output LDES members to the Console
    Given context 'tests/018.client-output-to-console' is started
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    When I start the LDES Client 'LDIO' workbench
    Then the Client CLI contains 1 members
    When I have uploaded the data files: 'delta'
    Then the Client CLI contains 50 members
