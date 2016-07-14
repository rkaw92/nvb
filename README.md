# nvb
This utility lets you write or launch a process that will wait for a given set of clients to connect to it. **HTTP-based Promise.all() for the console!**

Each client ("part") is identified by a name. When all clients have connected, the listener ends its job and yields success (for CLI, this means `exit 0`; for `nvb.listen()` it's a resolved promise).

# Install
```sh
# for a global install as root, use:
npm install -g nvb
# or if you prefer a local install for use in your project, with CLI tools in ./node_modules/.bin :
npm install nvb --save
```

# Use from CLI
In one terminal:
```sh
nvb clientA clientB
# The process does not exit until you've called both clients
# Also, on timeout, the exit code will be 2 - you can inspect the last command's exit code by executing the below:
echo $?
```
In another:
```sh
nvb-client clientA
nvb-client clientB
```
The main `nvb` process should exit after you've called both clientA and clientB.
Try that again, but call the client with the same name twice or a name that has not been declared on the server and observe what happens.

Also add some auth and configure a custom port, and pass two fancy names to wait for:
```sh
export NVB_PORT=15678
export NVB_TOKEN=super-secret-stuff
export NVB_TIMEOUT=10000
nvb mainApp backgroundWorker &
# Børk børk
NVB_TOKEN=totally-forgot nvb-client backgroundWorker
# Only the main app is having a good day today:
nvb-client mainApp
# In a sec, you're going to see nvb complain about the background worker missing
```

# Use from Node
```js
// On the server that will listen to the minions waking up:
require('nvb').listen({ parts: [ 'minion1', 'minion2' ] }).then(onFulfilled, onRejected);

// On the clients:
require('nvb').notify({ name: 'minion1' });
```

## nvb.listen([ options ]) → Promise
Start listening for all clients to connect.

## nvb.notify([ options ]) → Promise
Connect to an nvb server and indicate the client's presence.

# Options
### options.parts : Array.\<string\>
The set of client names to await. When all of them have connected, the promise resolves. Only used on the server.
### options.address : string
The address to listen on or to connect to. By default, `::` is used on the server (all interfaces) and `::1` on the client (localhost).
### options.port : number
The port to listen on or to connect to. By default, `6786` or whatever is passed in environment variable `NVB_PORT`.
### options.token : string
If passed, uses a string value to authenticate against the server using an `X-NVB-Token`. On the server, this parameter sets the required token. Defaults to env variable `NVB_TOKEN` - unused if empty.
### options.timeout : number
Sets the timeout (ms) for connecting and listening. By default, 10000 on the client and 60000 on the server.

# License
MIT
