const socketServer = (socket, io) => {
     let userOnline = [];
     socket.on('online', (userId) => {
          console.log(`mesage`, userId);
          socket.join(userId);
          checkOnline = userOnline.some((u) => u.userId === userId);
          if (!checkOnline) {
               userOnline.push({ userId, socketId: socket.id });
          }
          io.emit('usersOnline', userOnline);
     });
     socket.on('disconnect', () => {
          userOnline = userOnline.filter((u) => u.socketId !== socket.id);
          io.emit('usersOnline', userOnline);
     });
     socket.on('openConversation', (conversationId) => {
          console.log(conversationId);
          socket.join(conversationId);
     });
     socket.on('sendMessage', (message) => {
          const conversation = message.conversation;
          if (!conversation) {
               return;
          }
          conversation.users.forEach((element) => {
               if (element._id === message.sender._id) {
                    return;
               }
               socket.in(element._id).emit('receivedMessage', message);
          });
     });
};
module.exports = { socketServer };
