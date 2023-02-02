import fastify from 'fastify'
import minimist from 'minimist'
import { MongoClient } from "mongodb";

const server = fastify();

const args = minimist(process.argv.slice(2));
const silent: boolean = (/true/i).test(args['silent']);
if (!silent) {
  console.debug("Arguments: ", args);
}

const port = args['port'] || 9000;
const host = args['host'] || 'localhost';
const connectionUri = args['connection-uri'] || 'mongodb://localhost:27017';

const mongo = new MongoClient(connectionUri);

server.addHook('onReady', async () => {
  await mongo.connect();
});

server.addHook('onClose', async () => {
  await mongo.close();
})

server.addHook('onResponse', (request, reply, done) => {
  if (!silent) {
    const method = request.method;
    const statusCode = reply.statusCode;
    console.debug(method === 'POST' 
      ? `${method} ${request.url} ${request.headers['content-type']} ${statusCode}` 
      : `${method} ${request.url} ${statusCode}`);
  }
  done();
});

interface CountParameters {
  database: string;
  collection: string;
}

server.get('/:database/:collection', async (request, reply) => {
  const parameters = request.params as CountParameters;
  const count = await mongo.db(parameters.database).collection(parameters.collection).estimatedDocumentCount({});
  reply.send({count: count});
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
