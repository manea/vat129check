import { createApp } from './app.mjs';

const port = Number(process.env.PORT ?? 4227);
const host = process.env.HOST || '127.0.0.1';
const basePath = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : '/vat129check';

const instance = createApp({
  basePath,
  dataDir: process.env.VAT129CHECK_DATA_DIR,
  dbPath: process.env.VAT129CHECK_DB_PATH,
});

const bound = await instance.listen(port, host);
console.log(
  JSON.stringify({
    service: 'vat129check',
    status: 'listening',
    url: bound.url,
    basePath: instance.basePath,
  }),
);

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ service: 'vat129check', event: 'shutdown', signal }));
  await instance.close();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
