// import
const { socketServer } = require('./src/Socket/socker');
const { app } = require('./src/app');
const logger = require('./src/logger');
const { Server } = require('socket.io');

// ----------------------------------------------------------
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    logger.info(`server is running in PORT: ${PORT}`);
});
// const io = new Server(server, {
//     pingTimeout: 60000,
// });
// io.on('connection', (socket) => {
//     logger.info('Co nguoi ket noi', socket.id);
//     socketServer(socket, io);
// });
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (client) => {
    console.log('CO nguoi ket noi', client.id);
    socketServer(client, io);
});
