import { LdesFragmentController, LdesFragmentRepository, LdesFragmentService, IAlias, TreeNode, TreeRelation } from '../src'

describe('controller tests', () => {
    const originalBaseUrl = new URL('http://www.example.org');
    const controllerBaseUrl = new URL("http://www.ldes-server-simulator.org");
    const firstPartialId = '/id/fragment/1';
    const secondPartialId = '/id/fragment/2';
    const thirdPartialId = '/id/fragment/3';
    const body = {
        '@id': new URL(firstPartialId, originalBaseUrl).href,
        "tree:relation": [
            { "tree:node": new URL(secondPartialId, originalBaseUrl).href } as TreeRelation,
            { "tree:node": new URL(thirdPartialId, originalBaseUrl).href } as TreeRelation,
        ]
    } as TreeNode;
    const partialWithQueryId = '/fragment?id=1';
    const queryIdAlias: IAlias = {
        alias: new URL(partialWithQueryId, originalBaseUrl).href,
        original: new URL(firstPartialId, originalBaseUrl).href
    };

    let sut: LdesFragmentController;
    let repository: LdesFragmentRepository;

    beforeEach(() => {
        repository = new LdesFragmentRepository();
        sut = new LdesFragmentController(new LdesFragmentService(controllerBaseUrl, repository));
    });

    describe('get statistics tests', () => {
        test('should initially return empty statistics', () => {
            const statistics = sut.getStatistics();
            expect(statistics.body).not.toBe(undefined);
            expect(statistics.body.aliases).toHaveLength(0);
            expect(statistics.body.fragments).toHaveLength(0);
        });
        test('should return correct statistics', () => {
            sut.postFragment({body: body});
            sut.postAlias({body: queryIdAlias});
            const statistics = sut.getStatistics();
            expect(statistics.body).not.toBe(undefined);
            expect(statistics.body.aliases).toEqual([partialWithQueryId]);
            expect(statistics.body.fragments).toEqual([firstPartialId]);
        });
    });

    describe('store fragment tests', () => {
        test('should store the fragment', () => {
            const fragmentInfo = sut.postFragment({body: body});
            expect(fragmentInfo.body).not.toBe(undefined);
            expect(fragmentInfo.body.id).toBe(firstPartialId);

            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
        });
        test('should replace the fragment ID', () => {
            sut.postFragment({body: body});
            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.['@id']).toBe(new URL(firstPartialId, controllerBaseUrl).href);
        });
        test("should replace the relation's node ID", () => {
            sut.postFragment({body: body});
            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.['tree:relation'].length).toBe(body['tree:relation'].length);
            expect(fragment?.['tree:relation'].map(x => x['tree:node'])).toEqual([
                new URL(secondPartialId, controllerBaseUrl).href,
                new URL(thirdPartialId, controllerBaseUrl).href
            ]);
        });
    });

    describe('retrieve fragment tests', () => {
        test('should return stored fragment on request', () => {
            repository.save(firstPartialId, body);
            const fragment = sut.getFragment({query: {id: firstPartialId}});
            expect(fragment.body).not.toBeUndefined();
            expect(fragment.body?.['@id']).toBe(body['@id']);
        });
        test('should return 404 if fragment not found', () => {
            const fragment = sut.getFragment({query: {id: '/dummy/id'}});
            expect(fragment.body).toBeUndefined();
            expect(fragment.status).toBe(404);
        });
    });

    describe('redirection tests', () => {
        test('should store alias', () => {
            const redirect = sut.postAlias({body: queryIdAlias});
            expect(redirect.body).not.toBeUndefined();
            expect(redirect.body).toEqual({from: partialWithQueryId, to: firstPartialId});
        });
        test('should retrieve fragments by alias', () => {
            sut.postFragment({body: body});
            sut.postAlias({body: queryIdAlias});
            const fragment = sut.getFragment({query: {id: firstPartialId}});
            expect(fragment.body).not.toBeUndefined();
            expect(fragment.body?.['@id']).toBe(body['@id']);
        });
        test('should retrieve fragments by alias, even recursively', () => {
            sut.postFragment({body: body});
            sut.postAlias({body: queryIdAlias});

            const firstMemberId = '/fragment/first';
            const firstMemberAlias: IAlias = {
                alias: new URL(firstMemberId, originalBaseUrl).href,
                original: new URL(partialWithQueryId, originalBaseUrl).href
            };
            sut.postAlias({body: firstMemberAlias});
            const fragment = sut.getFragment({query: {id: firstMemberId}});
            expect(fragment.body).not.toBeUndefined();
            expect(fragment.body?.['@id']).toBe(body['@id']);
        });
    });

    describe('seed tests', () => {
        test('should serve seeded data', async () => {
            await sut.seed('./test/data');
            expect(sut.getFragment({query: {id: '/id/fragment/1'}})).not.toBeUndefined();
            expect(sut.getFragment({query: {id: '/id/fragment/2'}})).not.toBeUndefined();
        });
    });
});
