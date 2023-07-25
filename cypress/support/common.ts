/// <reference types="cypress" />

export function checkSuccess(result: any): Cypress.Chainable<boolean> {
    const success = result.code === 0;
    return success ? cy.task('resolve', success) : cy.task('error', result).then(() => false);
}
