export class LdesListFragments {

    private _containerId: string;

    constructor(private _serviceName?: string) { }

    public get serviceName() {
        return this._serviceName || 'ldes-list-fragments';
    }

    lastFragment() {
        return cy.exec(`docker ps -f "name=${this.serviceName}$" -q`)
            .then(result => {
                this._containerId = result.stdout;
                let previousUrl;
                return this.lastFragmentUrl(this._containerId).then(url => previousUrl = url).then(() => cy.waitUntil(
                    () => this.lastFragmentUrl(this._containerId).then(url => url === previousUrl ? true : (previousUrl = url, false)), 
                    { timeout: 60000, interval: 1500 })).then(() => previousUrl);
            });
    }

    private lastFragmentUrl(containerId: string) {
        return cy.exec(`docker logs ${containerId}`).then(result => result.stdout.split('\n').pop());
    }
}