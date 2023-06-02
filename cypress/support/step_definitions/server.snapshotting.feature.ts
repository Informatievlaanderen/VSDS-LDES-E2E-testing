/// <reference types="cypress" />

import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { server, mongo, testPartialPath, testDatabase, range } from "./common_step_definitions";

function ingestDataSet(size: string, start: number, end: number, memberType: string) {
    range(start, end).forEach(member => {
        cy.readFile(`${testPartialPath()}/data/${size}/member${member}.ttl`, 'utf8').then(content => cy.request({
            method: 'POST',
            url: `http://localhost:8080/${memberType}`,
            headers: { 'Content-Type': 'text/turtle' },
            body: content
        }));
    });
}

// Given

let initialMemberCount: number;
Given('I ingest a {string} dataset with {int} members', (dataset: string, count: number) => {
    switch (dataset) {
        case 'small':
        case 'medium': {
            ingestDataSet(dataset, 1, count, 'mobility-hindrances');
            initialMemberCount = count;
            break;
        }
        default: throw new Error(`Unknown dataset size '${dataset}'`);
    }
})

Given('the {string} contains {int} fragments', (collection: string, count: number) => {
    const expected = [`/${collection}/by-page`, ...range(1, count - 1).map(x => `/${collection}/by-page?pageNumber=${x}`)];
    mongo.fragmentIds(testDatabase())
        .then((ids: string[]) => ids.filter(x => x.startsWith(`/${collection}`)))
        .then(actual => {
            expect(actual.length).to.equal(count);
            expect(actual).to.eql(expected);
        });
})

Given('I ingest a {string} dataset with remaining {int} members', (datasetSize: string, count: number) => {
    switch (datasetSize) {
        case 'small':
        case 'medium': {
            ingestDataSet(datasetSize, initialMemberCount + 1, initialMemberCount + count, 'mobility-hindrances');
            break;
        }
        default: throw new Error(`Unknown dataset size '${datasetSize}'`);
    }
})

// When

When('I create a snapshot for {string}', (collection: string) => {
    server.createSnapshot(collection);
})

// Then

function checkSnapshots(count: number, prefix: string) {
    mongo.snapshotIds(testDatabase()).then(ids => {
        expect(ids.length).to.equal(count);
        snapshotName = ids[0] as string;
        expect(snapshotName).to.match(new RegExp(`^${prefix}-\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{1,9}`));
    })
}

let snapshotName: string;
Then('a snapshot is created having a name starting with {string}', (prefix: string) => {
    checkSnapshots(1, prefix);
});

Then('another snapshot is created having a name starting with {string}', (prefix: string) => {
    checkSnapshots(2, prefix);
});

Then('additional {int} fragments are created for the snapshot', (count: number) => {
    const expected = [`/${snapshotName}`, ...range(1, count - 1).map(x => `/${snapshotName}?pageNumber=${x}`)];

    mongo.fragmentIds(testDatabase()).then(ids => {
        const actual = ids.filter(x => x.startsWith(`/${snapshotName}`))
        expect(actual.length).to.equal(count);
        expect(actual).to.eql(expected);
    })
})
