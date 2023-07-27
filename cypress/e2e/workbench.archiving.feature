@workbench @archiving
Feature: LDES Workbench Archiving

  @test-033 @gipod @archiving
  Scenario Outline: 033: Can create and read from a file archive from the server using the '<workbench>' Workbench
    Given the members are stored in database 'gipod'
    And I have configured the archive directory
    And context 'tests/033.archiving' is started
    And I have aliased the pre-seeded simulator data set
    When I start the create archive '<workbench>' workbench
    And I wait until the '<workbench>' workbench finished archiving
    And the LDES server is available and configured
    Then the LDES contains 0 members
    When I start the read archive '<workbench>' workbench
    Then the LDES contains 1016 members
    And I clean up the '<workbench>' workbench archive

    @nifi
    Examples:
      | workbench |
      | NIFI      |

    @ldio
    Examples:
      | workbench |
      | LDIO      |
