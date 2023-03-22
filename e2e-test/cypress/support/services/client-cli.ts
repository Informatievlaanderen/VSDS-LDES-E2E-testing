/// <reference types="cypress" />

export class ClientCli {

    public get serviceName() {
        return 'ldio-client-cli'
    }

    private isReady(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.includes("Started Application"));
    }

    waitAvailable() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.isReady(containerId), { timeout: 60000, interval: 5000 });
            });
    }

    checkCount(count: number) {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                const containerId = result.stdout;
                return cy.waitUntil(() => this.hasCount(containerId, count), { timeout: 60000, interval: 5000 });
            });
    }

    hasCount(containerId: string, count: number): any {
        return cy.exec(`docker logs ${containerId}`).then(result => {
            const logs = result.stdout;
            const actualCount = (logs.match(new RegExp('http://purl.org/dc/terms/isVersionOf', 'g')) || []).length;
            cy.log('Actual count: ' + actualCount).then(() => actualCount === count)
        });
    }
}