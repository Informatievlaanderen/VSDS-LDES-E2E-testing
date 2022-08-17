import { Collection, Db, MongoClient } from "mongodb";
import { Member } from "./member";
import { IStorage } from "./storage";

interface Record extends Member {
    _id: string; // required for MongoDB
}

export class MongoStorage implements IStorage {
    private _client: MongoClient;
    private _db: Db | undefined;
    private _members: Collection<Record> | undefined;

    public constructor(connectionUri: string, private _databaseName: string, private _collectionName: string) {
        this._client = new MongoClient(connectionUri);
    }

    public get storageTypeName(): string {
        return 'MongoDB';
    }

    public get memberTypeName(): string {
        return this._collectionName;
    }

    public async initialize() {
        await this._client.connect();
        this._db = this._client.db(this._databaseName);
        this._members = this._db?.collection(this._collectionName);
    }
    public terminate() {
        return this._client.close();
    }

    public async count(): Promise<number> {
        const count = await this._members?.estimatedDocumentCount({});
        return count || 0;
    }

    public async lastIds(maxCount: number): Promise<string[]> {
        const query = this._members?.find<Record>({}, {}) // get all _id's
            .sort({ _id: -1 }) // sorted descending
            .limit(maxCount); // limit result count
        const records = await query?.toArray();
        return records?.map(x => x._id) || [];
    }

    private find(id: string) {
        return this._members?.findOne({ _id: id });
    }

    public async member(id: string): Promise<Member | undefined> {
        const record = await this.find(id);
        return record ? { contentType: record.contentType, body: record.body } as Member : undefined;
    }

    public async exists(id: string): Promise<boolean> {
        const record = await this.find(id);
        return !!record;
    }

    public async insertOrUpdate(id: string, member: Member): Promise<string> {
        const result = await this._members?.replaceOne(
            { _id: id },
            { _id: id, body: member.body, contentType: member.contentType } as Record,
            { upsert: true });
        return (result?.acknowledged && result.upsertedId) as string || id;
    }

    public async deleteAll(): Promise<number> {
        const result = await this._members?.deleteMany({});
        return (result?.acknowledged && result.deletedCount) as number || 0;
    }
}
