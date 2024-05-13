// import
const httpErrors = require('http-errors');
const { ExpressPeerServer } = require('peer');
const { socketServer } = require('./src/Socket/socker');
const { app } = require('./src/app');
const logger = require('./src/logger');
const { Server } = require('socket.io');

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
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  },
});
io.on('connection', (socket) => {
  logger.info('socket io connect success');
  socketServer(socket, io);
});

// Error
app.use(async (req, res, next) => {
  next(httpErrors.NotFound(` 'SORRY' we couldn't find resource `));
});
