// renderer.js
const io = require('socket.io-client');
const socket = io('http://localhost:8080');

socket.on('pause-message', (msg) => {
    console.log(msg);
});
