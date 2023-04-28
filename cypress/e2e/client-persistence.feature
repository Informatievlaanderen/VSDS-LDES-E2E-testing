Feature: Client persistence test

  @test-020
  Scenario: 020: Client Can Pause And Resume Replication/Synchronization
    Given context 'tests/020.client-pause-and-resume' is started
    And I have aliased the pre-seeded simulator data set
    When I start the LDIO workflow
    And the sink contains around 250 members
    And I stop the LDIO workflow
    Then all but the first fragment have been requested once
    When I start the LDIO workflow
    And the sink contains 1016 members
    Then all but the first fragment have been requested once
