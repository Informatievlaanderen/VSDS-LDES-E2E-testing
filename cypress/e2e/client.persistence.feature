@client @persistence
Feature: LDES Client Persistence

  @test-020 @parkAndRide
  Scenario Outline: 020: Client Can Pause And Resume Replication/Synchronization Using '<workbench>' Workbench
    Given context 'tests/020.client-pause-and-resume' is started
    And I have aliased the 'parkAndRide' simulator data set
    When I start the LDES Client '<workbench>' workbench
    Then the sink collection 'parkAndRide' contains at least 250 members
    When I stop the LDES Client '<workbench>' workbench
    Then the sink log contains no warnings
    When I restart the LDES Client '<workbench>' workbench
    And the sink contains 1016 members in collection 'parkAndRide'
    Then the sink received every member only once

    @ldio
    Examples: 
      | workbench |
      | LDIO      |

    @nifi
    Examples: 
      | workbench |
      | NIFI      |
