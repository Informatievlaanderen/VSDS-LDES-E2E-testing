@server @retention 
Feature: LDES Server Retention

  @test-012 @gtfs @broken
  Scenario Outline: 012: Server Provides a Basic Retention Mechanism Using '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And I have configured the 'VIEWS_0_RETENTION_PERIOD' as 'PT15S'
    And I have configured the 'VIEWS_1_RETENTION_PERIOD' as 'PT30S'
    And I have configured the 'VIEWS_0_MEMBERLIMIT' as '150'
    And I have configured the 'VIEWS_1_MEMBERLIMIT' as '300'
    And context 'tests/012.server-provide-basic-retention' is started
    And I have uploaded the data files: 'alfa,beta'
    And I have uploaded the data files: 'gamma' with a duration of 10 seconds
    And I have aliased the data set
    And the LDES server is available

    Then the LDES contains 0 members
    And the LDES has a view 'V' named 'by-short-time'
    And the LDES has a view 'W' named 'by-longer-time'
    
    When I start the '<workbench>' workbench
    And the LDES contains 501 members
    And I refresh view 'V'
    And I refresh view 'W'
    Then view 'V' links to 'immutable' fragment 'A' containing 150 members
    And fragment 'A' links to 'immutable' fragment 'B' containing 150 members
    And fragment 'B' links to 'immutable' fragment 'C' containing 150 members
    And fragment 'C' links to 'mutable' fragment 'D' containing 51 members
    And view 'W' links to 'immutable' fragment 'F' containing 300 members
    And fragment 'F' links to 'mutable' fragment 'G' containing 201 members

    When fragment 'A' is deleted and returns HTTP code 410
    And fragment 'B' is deleted and returns HTTP code 410
    And fragment 'C' is deleted and returns HTTP code 410
    And I refresh view 'V'
    And I refresh view 'W'
    # Note that the members should not yet be deleted until both views expire hence the check below
    Then the LDES should contain 501 members
    And view 'V' links to 'mutable' fragment 'D' containing 51 members
    And view 'W' links to 'immutable' fragment 'F' containing 300 members
    
    When fragment 'F' is deleted and returns HTTP code 410
    # Note that we do not know when the retention algorithm runs, so we wait until members are purged 
    And the LDES contains 201 members
    And I refresh view 'V'
    And I refresh view 'W'
    Then view 'V' links to 'mutable' fragment 'D' containing 51 members
    And view 'W' links to 'mutable' fragment 'G' containing 201 members

    When I have uploaded the data files: 'delta,epsilon' with a duration of 10 seconds
    And the LDES contains 317 members
    And I refresh view 'V'
    And I refresh view 'W'
    Then view 'V' links to 'immutable' fragment 'D' containing 150 members
    And fragment 'D' links to 'mutable' fragment 'E' containing 17 members
    And view 'W' links to 'immutable' fragment 'G' containing 300 members
    And fragment 'G' links to 'mutable' fragment 'H' containing 17 members

    When fragment 'D' is deleted and returns HTTP code 410
    And fragment 'G' is deleted and returns HTTP code 410
    # Note that we do not know when the retention algorithm runs, so we wait until members are purged 
    Then the LDES contains 17 members
    And I refresh view 'V'
    And I refresh view 'W'
    And view 'V' links to 'mutable' fragment 'H' containing 17 members
    And view 'W' links to 'mutable' fragment 'E' containing 17 members

    @ldio
    Examples:
      | workbench |
      | LDIO      |

    @nifi
    Examples:
      | workbench |
      | NIFI      |
