import { LdesFragmentController, LdesFragmentRepository, LdesFragmentService, Redirection, TreeNode, TreeRelation } from '../src'

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
    const queryRedirection: Redirection = {
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
            expect(statistics.aliases).toHaveLength(0);
            expect(statistics.fragments).toHaveLength(0);
        });
        test('should return correct statistics', () => {
            sut.postFragment(body);
            sut.postAlias(queryRedirection);
            const statistics = sut.getStatistics();
            expect(statistics.aliases).toEqual([partialWithQueryId]);
            expect(statistics.fragments).toEqual([firstPartialId]);
        });
    });

    describe('store fragment tests', () => {
        test('should store the fragment', () => {
            const response = sut.postFragment(body);
            expect(response.path).toBe(firstPartialId);
            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
        });
        test('should replace the fragment ID', () => {
            sut.postFragment(body);
            const fragment = repository.get(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.['@id']).toBe(new URL(firstPartialId, controllerBaseUrl).href);
        });
        test("should replace the relation's node ID", () => {
            sut.postFragment(body);
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
            const fragment = sut.getFragment(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.['@id']).toBe(body['@id']);
        });
    });

    describe('redirection tests', () => {
        test('should store alias', () => {
            const response = sut.postAlias(queryRedirection);
            expect(response).toEqual({ redirect: { from: partialWithQueryId, to: firstPartialId } });
        });
        test('should retrieve fragments by alias', () => {
            sut.postFragment(body);
            sut.postAlias(queryRedirection);
            const fragment = sut.getFragment(firstPartialId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.['@id']).toBe(body['@id']);
        });
        test('should retrieve fragments by alias, even recursively', () => {
            sut.postFragment(body);
            sut.postAlias(queryRedirection);

            const firstMemberId = '/fragment/first';
            const firstMemberRedirection: Redirection = {
                alias: new URL(firstMemberId, originalBaseUrl).href,
                original: new URL(partialWithQueryId, originalBaseUrl).href
            };
            sut.postAlias(firstMemberRedirection);
            const fragment = sut.getFragment(firstMemberId);
            expect(fragment).not.toBeUndefined();
            expect(fragment?.['@id']).toBe(body['@id']);
        });
    });

    describe('seed tests', () => {
        test('should serve seeded data', async () => {
            await sut.seed('./test/data');
            expect(sut.getFragment('/id/fragment/1')).not.toBeUndefined();
            expect(sut.getFragment('/id/fragment/2')).not.toBeUndefined();
        });
    });
});
