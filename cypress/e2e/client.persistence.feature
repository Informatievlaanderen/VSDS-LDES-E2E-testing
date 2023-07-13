@client @persistence
Feature: LDES Client Persistence

  @test-020 @gipod
  Scenario Outline: 020: Client Can Pause And Resume Replication/Synchronization Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And context 'tests/020.client-pause-and-resume' is started
    And I have aliased the pre-seeded simulator data set
    When I start the '<workbench>' workbench
    And the sink contains around 250 members
    And I stop the '<workbench>' workbench
    Then all but the first fragment have been requested once
    When I restart the '<workbench>' workbench
    And the sink contains 1016 members
    Then all but the first fragment have been requested once

    @ldio
    Examples: 
      | workbench |
      | LDIO      |


    @nifi @broken
    # java.lang.NoClassDefFoundError: Could not initialize class org.hibernate.cfg.Environment
    Examples: 
      | workbench |
      | NIFI      |
