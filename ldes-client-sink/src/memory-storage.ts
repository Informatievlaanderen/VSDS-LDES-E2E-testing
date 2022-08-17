import { Member } from "./member";
import { IStorage } from "./storage";

interface MemberWithId extends Member {
    _id: string;
}

export class MemoryStorage implements IStorage {
   
    private _db: MemberWithId[] = [];

    constructor(private _memberTypeName: string) {
    }

    get storageTypeName(): string {
        return 'in-memory';
    }

    get memberTypeName(): string {
        return this._memberTypeName;
    }
    
    private _initialized: boolean = false;
    public get initialized() {
        return this._initialized;
    }

    initialize(): Promise<void> {
        return new Promise(resolve => {
            this._initialized = true;
            resolve();
        });
    }

    private _terminated: boolean = false;
    public get terminated() {
        return this._terminated;
    }

    terminate(): Promise<void> {
        return new Promise(resolve => {
            this._terminated = true;
            resolve();
        });
    }

    private get dbCount() {
        return this._db.length;
    }

    count(): Promise<number> {
        return new Promise(resolve => resolve(this.dbCount));
    }

    private dbLastIds(maxCount: number):string[] {
        return this._db.slice(-maxCount).map(x => x._id);
    }

    lastIds(maxCount: number): Promise<string[]> {
        return new Promise(resolve => resolve(this.dbLastIds(maxCount)));
    }

    private dbGetById(id: string): Member | undefined {
        const member = this._db.filter(x => x._id === id).shift();
        return member ? { body: member.body, contentType: member.contentType } as Member : undefined;
    }

    member(id: string): Promise<Member | undefined> {
        return new Promise(resolve => resolve(this.dbGetById(id)));
    }

    exists(id: string): Promise<boolean> {
        return new Promise(resolve => resolve(this.dbGetById(id) != undefined));
    }

    private dbInsertOrUpdate(id: string, member: Member): string {
        const index = this._db.findIndex(x => x._id === id);
        if (index !== -1) {
            this._db.splice(index, 1);
        }
        this._db.push({...member, _id: id} as MemberWithId);
        return id;
    }

    insertOrUpdate(id: string, member: Member): Promise<string> {
        return new Promise(resolve => resolve(this.dbInsertOrUpdate(id, member)));
    }

    private dbDeleteAll(): number {
        const count = this.dbCount;
        this._db = [];
        return count;
    }

    deleteAll(): Promise<number> {
        return new Promise(resolve => resolve(this.dbDeleteAll()));
    }

}