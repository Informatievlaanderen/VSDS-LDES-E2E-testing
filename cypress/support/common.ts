/// <reference types="cypress" />

export function checkSuccess(result: any): Cypress.Chainable<boolean> {
    const success = result.code === 0;
    return success ? cy.task('resolve', success) : cy.task('error', result).then(() => false);
}

export const timeouts = {
    exec: 120000,
    ready: 60000,

    fastAction: 15000,
    averageAction: 60000,
    slowAction: 600000,

    fastCheck: 1000,
    averageCheck: 3000,
    slowCheck: 5000,

    dockerPull: 300000,
    verySlowAction: 1200000,
}