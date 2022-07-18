import { Quad } from "n3";
import { Member } from "./member";
import { IStorage } from "./storage";

const ns = {
    rdf: {
        type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    }
}

export class MemberController {

    public constructor(private _memberType: string, private _storage: IStorage, private _maxGetMemberCount = 100) { }

    public init() {
        return this._storage.initialize();
    }

    public dispose() {
        return this._storage.terminate();
    }

    public async getIndex() {
        const total = await this._storage.count();
        const response: any = {};
        response[this._storage.memberTypeName] = { total: total };
        return response;
    }

    public getMember(id: string) {
        return this._storage.member(id);
    }

    public async getMembers() {
        function asLocalUrl(id: string) {
            const params = new URLSearchParams();
            params.append('id', id);
            return '/member?' + params.toString();
        }

        const total = await this._storage.count();
        const ids = await this._storage.lastIds(this._maxGetMemberCount);
        const response: any = {};
        response[this._storage.memberTypeName] = {
            total: total,
            count: ids?.length,
            members: ids?.map(x => asLocalUrl(x))
        }
        return response;
    }

    public async postMember(member: Member, quads: Quad[]) {
        const ids = quads.filter(x => x.predicate.value === ns.rdf.type && x.object.value === this._memberType);

        if (ids && ids.length === 1 && ids[0]) {
            const id = ids[0].subject.value;
            const exists = await this._storage.exists(id);
            if (exists) {
                console.warn(`overriding id '${id}'`);
            }
            return this._storage.insertOrUpdate(id, member);
        }
        
        console.warn('missing unique id:\n', ids);
        return undefined;
    }

    public async deleteMembers() {
        const count = await this._storage.deleteAll();
        return { count: count };
    }
}
