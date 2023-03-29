import { CronJob } from 'cron';
import { existsSync, readFileSync } from 'fs';
import minimist from 'minimist';
import { JsonGenerator } from './generator.js';
import fetch from 'node-fetch';

const args = minimist(process.argv.slice(2));
const silent: boolean = (/true/i).test(args['silent']);

const cron = args['cron'] || '* * * * * *';
const mimeType = args['mimeType'] || 'application/json';
if (!silent) console.debug("Arguments: ", args);

let template: string = args['template'] || (args['templateFile'] && readFileSync(args['templateFile'], {encoding: 'utf8'}));
if (!template) throw new Error('Missing template or templateFile');

let mapping = args['mapping'] || (args['mappingFile'] && readFileSync(args['mappingFile'], {encoding: 'utf8'}));
if (!mapping) throw new Error('Missing mapping or mappingFile');
mapping = JSON.parse(mapping);

const generator: JsonGenerator = new JsonGenerator(template, mapping);

const job = new CronJob(cron, async () => {
    const next = generator.createNext();
    const body = JSON.stringify(next);
    const targetUrl = args['targetUrl'] || (existsSync('./TARGETURL') && readFileSync('./TARGETURL', 'utf-8'));
    if (targetUrl) {
        if (!silent) console.debug('Sending: ', body);
        await fetch(targetUrl, {
            method: 'post',
            body: body,
            headers: {'Content-Type': mimeType}
        });
    } else { // if no targetUrl specified, send to console
        console.info(body);
    }
    if (!silent) console.debug('Next run at: ', job.nextDate().toString());
});

if (!silent) console.debug('Runs at: ', cron);
job.start();
