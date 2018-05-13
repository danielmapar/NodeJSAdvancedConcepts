// Every child will have 1 threas within the pull
process.env.UV_THREADPOOL_SIZE = 1;

const express = require('express');
const cluster = require('cluster');
const crypto = require('crypto');
const app = express();

// We can run our server in multiple forks
if (cluster.isMaster) {
  // Every child has a thread pull
  cluster.fork();
  cluster.fork();
  cluster.fork();
} else {
  function doWork(duration) {
    const start = Date.now();
    while(Date.now() - start < duration) {

    }
  }

  app.get('/', (req, res) => {
    // This while loop will lock the event loop
    // doWork(5000);
    crypto.pbkdf2('a', 'b', 100000, 512, 'sha512', () => {
      console.log('Hash:', Date.now() - start);
    });
    res.send('Hi there');
  });

  app.get('/fast', (req, res) => {
    res.send('This was fast');
  });

  app.listen(3000);
}
