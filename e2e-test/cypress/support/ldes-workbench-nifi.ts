import { v4 as uuidv4 } from 'uuid';

export class LdesWorkbenchNiFi {
    constructor(private baseUrl: string) { 
    }

    /**
     * Checks if the Apache NiFi workbench is ready to accept login attempts
     * @returns true if ready, false otherwise
     */
    isReady(): Cypress.Chainable<boolean> {
        return cy.exec(`curl --insecure ${this.baseUrl}/nifi`, { failOnNonZeroExit: false }).then(exec => exec.code === 0);
    }

    logon(credentials: { username: string; password: string; }) {
        const loaded = 'flowClusterSummary';
        return cy.intercept(`${this.baseUrl}/nifi-api/flow/cluster/summary`).as(loaded)
            .visit(`${this.baseUrl}/nifi/login`)
            .get('#username').type(credentials.username)
            .get('#password').type(credentials.password)
            .get('#login-submission-button').click().wait(`@${loaded}`);
    }

    uploadWorkflow(file: string){
        return cy.get('#operation-context-id').then(div => {
            const groupId = div.text();
            return cy.readFile(file, null).then(buffer => {
                const blob = Cypress.Blob.base64StringToBlob(buffer.toString('base64'), 'application/json');
                const formData = new FormData();
                formData.append('file', blob);
                formData.append('disconnectedNodeAcknowledged', 'false');
                formData.append('groupName', 'nifi-workflow');
                formData.append('positionX', '400'); 
                formData.append('positionY', '60');
                formData.append('clientId', uuidv4());
                return cy.request({
                    url: `${this.baseUrl}/nifi-api/process-groups/${groupId}/process-groups/upload`,
                    method: 'POST',
                    headers: {
                        'content-type': 'multipart/form-data',
                      },
                    body: formData
                });
            })
        });
    }
}
