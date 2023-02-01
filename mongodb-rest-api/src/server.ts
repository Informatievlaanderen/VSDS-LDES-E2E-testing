import fastify from 'fastify'
import minimist from 'minimist'
import { MongoStorage } from './mongo-storage';

const server = fastify();

const args = minimist(process.argv.slice(2));
const silent: boolean = (/true/i).test(args['silent']);
if (!silent) {
  console.debug("Arguments: ", args);
}

const port = args['port'] || 9000;
const host = args['host'] || 'localhost';
const connectionUri = args['connection-uri'] || 'mongodb://localhost:27017';
const storage = new MongoStorage(connectionUri);

server.addHook('onReady', async () => {
  await storage.initialize();
});

server.addHook('onClose', async () => {
  await storage.terminate();
})

interface CountParameters {
  databaseName: string;
  collectionName: string;
}

server.get('/:databaseName/:collectionName', async (request, reply) => {
  const parameters = request.params as CountParameters;
  reply.send({count: await storage.count(parameters.databaseName, parameters.collectionName)});
});

async function closeGracefully(signal: any) {
  if (!silent) {
    console.debug(`Received signal: `, signal);
  }
  await server.close();
  process.exitCode = 0;
}

process.on('SIGINT', closeGracefully);

function exitWithError(err: any) {
  console.error(err);
  process.exit(1);
}

const options = { port: port, host: host };
server.listen(options, async (err: any, address: string) => {
  if (err) {
    exitWithError(err);
  }
  if (!silent) {
    console.debug(`MongoDB REST API listening at ${address}`);
  }
});
