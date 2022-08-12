import argsParser from 'minimist';
import { readFile } from 'node:fs/promises';
import { convertWkt } from './converter.js';

var args = argsParser(process.argv.slice(2));

function exitWithError(err) {
    console.error("Error: ", err);
    process.exit(1);
  }

const wktFile = args['file'];
if (!wktFile) exitWithError('no --file specified');

const wktIn = await readFile(wktFile, { encoding: 'utf-8' });
try {
  const wktOut = convertWkt(wktIn);
  console.info(wktOut);
} catch (error) {
  exitWithError(error);
}
