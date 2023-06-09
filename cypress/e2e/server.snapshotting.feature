@server @snapshotting
Feature: LDES Server Snapshot Functionality

  @test-025 @iow
  Scenario Outline: 025: Server Can Create Snapshot
    Given the members are stored in database 'test'
    And context 'tests/025.server-snapshot-ldes' is started
    And the LDES server is available and configured
    And I ingest a '<dataset-size>' dataset with <initial-member-count> members
    And the LDES contains <initial-member-count> members
    And the 'mobility-hindrances' contains <initial-fragment-count> fragments
    
    When I create a snapshot for 'mobility-hindrances'
    Then a snapshot is created having a name starting with 'mobility-hindrances/snapshot'
    And additional <snapshot-fragment-count> fragments are created for the snapshot
    
    When I ingest a '<dataset-size>' dataset with remaining <remaining-member-count> members
    And I create a snapshot for 'mobility-hindrances'
    Then another snapshot is created having a name starting with 'mobility-hindrances/snapshot'
    And additional <snapshot-fragment-count> fragments are created for the snapshot

    @fast @small
    Examples: 
      | dataset-size | initial-member-count | initial-fragment-count | snapshot-fragment-count | remaining-member-count |
      | small        |                    9 |                      2 |                       2 |                      2 |

    @slow @medium
    Examples: 
      | dataset-size | initial-member-count | initial-fragment-count | snapshot-fragment-count | remaining-member-count |
      | medium       |                  720 |                      9 |                       4 |                      6 |
