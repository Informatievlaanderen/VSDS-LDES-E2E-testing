Feature: Client persistence test

  @test-020
  Scenario: 020: Client Can Pause And Resume Replication/Synchronization
    Given context 'demos/020.client-pause-and-resume' is started
    # And the LDES server is available
    And I have aliased the pre-seeded simulator data set
    When I start the LDIO workflow
    And the sink contains 250 members
    And I pause the LDIO workflow output
    Then all but the first fragment have been requested once
    When I resume the LDIO workflow output
    And the sink contains 1016 members
    Then all but the first fragment have been requested once
