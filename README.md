# Node JS: Advanced Concepts

* Nodejs is separated in two dependencies

  * v8: An open source JS engine created by google. Its main purpose is to execute JS code outside of the browser

    * V8 compiles JavaScript directly to native machine code before executing it, instead of more traditional techniques such as interpreting bytecode or compiling the whole program to machine code and executing it from a filesystem. The compiled code is additionally optimized (and re-optimized) dynamically at runtime, based on heuristics of the code's execution profile. Optimization techniques used include inlining, elision of expensive runtime properties, and inline caching. The garbage collector is a generational incremental collector.

  * libuv: A c++ open source project that gives node access to the operating system underline file system, networking and some aspects of concurrency.
  ![NodeJS internals](./images/nodejs-internals.png)

![NodeJS internals 2](./images/nodejs-internals-2.png)

* Nodejs gives us a nice interface to use to related the JS side of our application to the C++ side of things. Node also provides a series of wrappers (fs, crypto, etc..)

![NodeJS libs](./images/nodejs-libs.png)

* Inside the Node repo we can find two main folders (https://github.com/nodejs/node)
  * ```lib```: is where all the JS code is located
    * Example: https://github.com/nodejs/node/tree/master/lib/internal/crypto/pbkdf2.js
    * This file is mostly validating inputs and forwarding this to the C++ function
    ```javascript
    const {
      PBKDF2
    } = process.binding('crypto');
    const ret = PBKDF2(password, salt, iterations, keylen, digest);
    ```
    * ```process.binding```: It's a feature that essentially goes out and grab the C++ feature and make it available inside the javascript

  * ```src```: is where all the C++ is located, and where node pulls ```libuv``` and ```v8```

    * ```PBKDF2``` is located inside  https://github.com/nodejs/node/blob/master/src/node_crypto.cc

    * ![NodeJS execution](./images/nodejs-execution.png)

    ```
    env->SetMethod(target, "PBKDF2", PBKDF2);

    void PBKDF2(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args);

    const EVP_MD* digest = nullptr;
    int keylen = -1;
    ```

## Process and Threads

* Process: Instance of a computer program that is being executed
  * A process can have multiple threads.
  * Threads are tasks that need to be executed (ex: read database, read file, multiple numbers, etc..)
  ![Thread](./images/thread.png)
  ![Threads](./images/threads.png)

* Scheduling: Which thread to process at any giving instant in time
![OS Scheduler](./images/os_scheduler.png)
* Urgent threads should not wait to long to be executed. (moving the mouse thread)
![CPU Cores](./images/cpu_cores.png)
* One core can process more than one thread at a time (multithreading or hyper-threading)

## The Event Loop

![Event Loop](./images/event_loop.png)

```
--> PSEUDO CODE

// Start: node myfile.js

// myFile.runContents(): First node takes the content of myfile.js and executes it

// New timers, tasks, operations are recorded from myfile running
const pendingTimers = [];
const pendingOSTasks = [];
const pendingOperations = [];

function shouldContinue() {
  // Check one: Any pending setTimeout, setInterval, setImmediate?

  // Check two: Any pending OS tasks? (Like server listening to port)

  // Check Three: Any pending long running operations? (Like fs module)

  return pendingTimers.length || pendingOSTasks.length || pendingOperations.length;
}

// Now we are inside the event loop
// Every single time the event loop runs inside our app, that is called a 'tick'

while(shouldContinue()) {
  // 1) Node looks at pendingTimers and sees if any functions are ready to be called. setTimeout, setInterval

  // 2) Node looks at pendingOSTasks and pendingOperations and calls relevants callbacks

  // 3) Pause execution. Continue whenever...
  // - a new pendingOSTask is done
  // - a new pendingOperation is done
  // - a timer is about to complete

  // 4) Look at pendingTimers. Call any setImmediate

  // 5) Handle any 'close' events
  // Example: readSteam
  // readSteam.on('close', () => { console.log("clean up") })

}

// End: exit back to terminal
```

### Pending Operations
![Event Loop Thread](./images/event_loop_thread.png)
* The Event loop runs in a single thread, but a lot of node libs are actually NOT single threaded. They run outside of the event loop / the single thread
  * ```node threads.js```
  ![Not Single Thread](./images/node_single_threaded_not.png)
  ![Not Single Thread 2](./images/node_single_threaded_not2.png)
  ![Not Single Thread 3](./images/node_single_threaded_not3.png)
  ![Not Single Thread 4](./images/node_single_threaded_not4.png)
  * For some very particular functions inside the STD lib, the Node C++ / libuv side of things decide to make expensive calculations outside of the event loop.
  * To do that, they make use of something called a Thread Pool
    * Series of 4 threads used for computation intensive tasks
    ![Not Single Thread 5](./images/node_single_threaded_not5.png)
    ![Not Single Thread 6](./images/node_single_threaded_not6.png)
    ![Not Single Thread 7](./images/node_single_threaded_not7.png)
    * Our cores in this example can process only 2 threads at a time
    ![Not Single Thread 8](./images/node_single_threaded_not8.png)
    * That explains why the first four calls took 2s (2 threads running inside one core) vs 1s (1 thread running in one core -- more resources)
  * Lets resize our Thread pool from libuv to only take 2 threads at a time
    * ```process.env.UV_THREADPOOL_SIZE = 2;```
    ![Not Single Thread 9](./images/node_single_threaded_not9.png)
    ![Not Single Thread 10](./images/node_single_threaded_not10.png)
    * ```process.env.UV_THREADPOOL_SIZE = 5;```
    ![Not Single Thread 11](./images/node_single_threaded_not11.png)
    ![Not Single Thread 12](./images/node_single_threaded_not12.png)
    * The OS scheduler plays the threads in a way that even with 2 cores (4 threads total), we still have similar times for all five (almost 2s each)

![Not Single Thread 13](./images/node_single_threaded_not13.png)

### Pending OS Tasks
