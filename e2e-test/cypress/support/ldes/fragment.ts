import { tree } from './rdf-common';
import { UrlResponse } from "./url-response";
import { Relation } from "./relation";


export class Fragment extends UrlResponse {
    get relations(): Relation[] {
        return this.store.getObjects(null, tree.relation, null).map(x => x.value)
            .map(id => new Relation(this.store.getQuads(id, null, null, null)));
    }

    get relation(): Relation {
        const relations = this.relations;
        expect(relations.length).to.equal(1);
        return relations[0];
    }
}
