const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

// Log ALL signals
const signals = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGUSR1', 'SIGUSR2', 'SIGPIPE', 'SIGALRM', 'SIGPROF', 'SIGBUS', 'SIGFPE', 'SIGSEGV', 'SIGILL', 'SIGABRT', 'SIGTRAP', 'SIGSYS'];
signals.forEach(sig => {
  process.on(sig, () => {
    console.error(`SIGNAL RECEIVED: ${sig}`);
    process.exit(0);
  });
});

process.on('exit', (code) => {
  console.error(`PROCESS EXITING: code=${code}`);
});

app.prepare().then(() => {
  const server = createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl).catch(err => {
      console.error('Handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Error');
      }
    });
  });
  
  server.listen(3000, '0.0.0.0', () => {
    console.log('> Ready on http://0.0.0.0:3000');
  });
  
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
  });
  
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });
});
