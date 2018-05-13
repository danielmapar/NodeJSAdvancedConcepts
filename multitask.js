// Expanding the Thread Pool to take 5 threads
// process.env.UV_THREADPOOL_SIZE = 5;

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const start = Date.now();

function doRequest() {
  https.request('https://www.google.com', res => {
    res.on('data', () => {

    });
    res.on('end', () => {
      console.log("HTTP Request: ", Date.now() - start);
    });
  }).end();
}

function doHash() {
  crypto.pbkdf2('a', 'b', 100000, 512, 'sha512', () => {
    console.log('Hash:', Date.now() - start);
  });
}

doRequest();

fs.readFile('multitask.js', 'utf8', () => {
  console.log("FS: ", Date.now() - start);
});

// If we comment one of those guys, we will have 4 spaces in our thread pool
// 1) FS
// 2, 3, 4) doHash
doHash();
doHash();
doHash();
doHash();
