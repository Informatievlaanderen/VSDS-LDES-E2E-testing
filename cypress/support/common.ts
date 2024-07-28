/// <reference types="cypress" />

export function checkSuccess(result: any): Cypress.Chainable<boolean> {
    const success = result.code === 0;
    return success ? cy.task('resolve', success) : cy.task('error', result).then(() => false);
}

export const timeouts = {
    exec: 120000,
    ready: 60000,
    check: 1000,

    fastAction: 15000,
    slowAction: 120000,
    slowCheck: 5000,
    dockerPull: 300000,
    verySlowAction: 1200000,
}