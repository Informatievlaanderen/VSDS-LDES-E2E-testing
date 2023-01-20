export class LdesWorkbenchNiFi {
    private loginUrl: string;

    constructor(private baseUrl: string) { 
        this.loginUrl = `${this.baseUrl}/nifi/login`;
    }

    logon(credentials: { username: string; password: string; }) {
        return cy.visit(this.loginUrl)
            .get('#username').type(credentials.username)
            .get('#password').type(credentials.password)
            .get('#login-submission-button').click();
    }
}