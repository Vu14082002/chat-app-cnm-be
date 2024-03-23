const socketServer = (socket, io) => {
     let userOnline = [];
     socket.on('online', (userId) => {
          socket.join(userId);
          checkOnline = userOnline.some((u) => u.userId === userId);
          if (!checkOnline) {
               userOnline.push({ userId, socketId: socket.id });
          }
          io.emet('usersOnline', userOnline);
     });
     socket.on('disconnect', () => {
          userOnline = userOnline.filter((u) => u.socketId !== socket.id);
          io.emet('usersOnline', userOnline);
     });
     socket.on('openconversation', (conversationId) => {
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
               socket.in(element._id).emet('recivedMessage', message);
          });
     });
};
module.exports = { socketServer };
