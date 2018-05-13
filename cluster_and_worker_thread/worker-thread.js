const express = require('express');
const app = express();
const Worker = require('webworker-threads').Worker;

app.get('/', (req, res) => {
  // This function will be stringyfied
  // and we wont be able to expect outter variables
  // to get updated
  const worker = new Worker(() => {
    this.onmessage = () => {
      console.log('worker')
      let counter = 0;
      while (counter < 1e9) {
        counter++;
      }
      postMessage(counter);
    }
  });
  worker.onmessage = (msg) => {
    console.log('main thread: ', msg)
  }
  worker.postMessage();
  res.send('Hi there');
});

app.get('/fast', (req, res) => {
  res.send('This was fast');
});

app.listen(3000);
