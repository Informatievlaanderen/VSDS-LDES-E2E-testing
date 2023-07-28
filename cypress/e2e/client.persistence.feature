@client @persistence
Feature: LDES Client Persistence

  @test-020 @gipod
  Scenario Outline: 020: Client Can Pause And Resume Replication/Synchronization Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/020.client-pause-and-resume' is started
    And I have aliased the pre-seeded simulator data set
    When I start the '<workbench>' workbench
    Then eventually the sink contains about 250 members
    When I stop the '<workbench>' workbench
    Then the sink log contains no warnings
    When I restart the '<workbench>' workbench
    And the sink contains 1016 members
    Then the sink received every member only once

    @ldio
    Examples: 
      | workbench |
      | LDIO      |


    @nifi
    Examples: 
      | workbench |
      | NIFI      |
