import { MongoClient } from "mongodb";

export class MongoStorage {
    private _client: MongoClient;

    public constructor(connectionUri: string) {
        this._client = new MongoClient(connectionUri);
    }

    public initialize() {
        return this._client.connect();
    }
    public terminate() {
        return this._client.close();
    }

    public async count(databaseName: string, collectionName: string): Promise<number> {
        const count = await this._client.db(databaseName).collection(collectionName).estimatedDocumentCount({});
        return count || 0;
    }
}
