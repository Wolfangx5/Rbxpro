let io;

function initSocket(server) {
  io = require('socket.io')(server);
  
  io.on('connection', (socket) => {
    console.log('A user connected');
    
  });
}

function emitMessage(event, data) {
  if (io) {
    io.emit(event, data);
    console.log('Message sent')
  } else {
    console.error('Socket server is not initialized');
  }
}

module.exports = {
  initSocket,
  emitMessage,
};