export class LdesWorkbenchNiFi {
    constructor(private baseUrl: string) { 
    }

    logon(credentials: { username: string; password: string; }) {
        const loaded = 'flowClusterSummary';
        return cy.intercept(`${this.baseUrl}/nifi-api/flow/cluster/summary`).as(loaded)
            .visit(`${this.baseUrl}/nifi/login`)
            .get('#username').type(credentials.username)
            .get('#password').type(credentials.password)
            .get('#login-submission-button').click().wait(`@${loaded}`);
    }
}