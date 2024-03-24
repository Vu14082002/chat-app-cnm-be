// import
const { socketServer } = require('./src/Socket/socker');
const { app } = require('./src/app');
const logger = require('./src/logger');
const { Server, Socket } = require('socket.io');

// ----------------------------------------------------------
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
     logger.info(`server is running in PORT: ${PORT}`);
});
// socket io
const io = new Server(server, {
     pingTimeout: 60000,
     cors: {
          origin: '*',
          methods: ['GET', 'POST'],
     },
});
io.on('connection', (socket) => {
     logger.info('socket io connect success');
     socketServer(socket, io);
});
