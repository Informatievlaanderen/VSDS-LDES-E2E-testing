import fastify from 'fastify'
import minimist from 'minimist'
import { LdesFragmentRepository } from './ldes-fragment-repository';
import { LdesFragmentService } from './ldes-fragment-service';
import { LdesFragmentController, Redirection } from "./ldes-fragment-controller";
import { TreeNode } from './tree-specification';

const server = fastify();
const args = minimist(process.argv.slice(2));
const silent: boolean = args['silent'] !== undefined;

if (!silent) {
  console.debug("arguments: ", args);
}
const port = args['port'] || 80;
const host = args['host'] || 'localhost';
const baseUrl = new URL(args['baseUrl'] || `http://${host}:${port}`);
const repository = new LdesFragmentRepository();
const service = new LdesFragmentService(baseUrl, repository);
const controller = new LdesFragmentController(service);

server.addHook('onRequest', (request, _reply, done) => {
  if (!silent) {
    console.debug(`${request.method} ${request.url}`);
  }
  done();
});

server.get('/', async (_request, _reply) => {
  return controller.getStatistics();
});

server.get('/*', async (request, reply) => {
  const fragment = controller.getFragment(request.url);
  reply.statusCode = fragment === undefined ? 404 : 200;
  return reply.send(fragment);
});

server.post('/ldes', async (request, reply) => {
  reply.statusCode = 201;
  return controller.postFragment(request.body as TreeNode);
});

server.post('/alias', async (request, reply) => {
  reply.statusCode = 201;
  return controller.postAlias(request.body as Redirection);
});

async function closeGracefully(signal: any) {
  if (!silent) {
    console.debug(`Received signal: `, signal);
  }
  await server.close();
  process.exitCode = 0;
}

process.on('SIGINT', closeGracefully);

const options = { port: port, host: host };
server.listen(options, async (err, address) => {
  if (args['seed']) {
    try {
      (await controller.seed(args['seed'])).forEach(x => {
        if (!silent) {
          console.debug(`seeded with file '${x.file}' containg fragment '${x.fragment}'`);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  if (err) {
    console.error(err)
    process.exit(1)
  }
  if (!silent) {
    console.log(`Simulator listening at ${address}`);
  }
});
