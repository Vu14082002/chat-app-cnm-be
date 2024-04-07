let userOnline = [];
const socketServer = (socket, io) => {
  socket.on('online', (userId) => {
    socket.join(userId);
    // Kiểm tra xem người dùng đã tồn tại trong danh sách hay chưa
    const existingUserIndex = userOnline.findIndex((u) => u.userId === userId);
    // Nếu người dùng chưa tồn tại, thêm vào danh sách
    if (existingUserIndex === -1) {
      userOnline.push({ userId, socketId: socket.id });
    } else {
      // Nếu người dùng đã tồn tại, cập nhật lại socketId
      userOnline[existingUserIndex].socketId = socket.id;
    }
    console.log(userOnline);
    io.emit('usersOnline', userOnline);
  });

  // Xử lý sự kiện ngắt kết nối
  socket.on('disconnect', () => {
    // Lọc ra người dùng đã ngắt kết nối và cập nhật lại danh sách
    userOnline = userOnline.filter((u) => u.socketId !== socket.id);
    console.log(userOnline);
    io.emit('usersOnline', userOnline);
  });
  // tạo room socket và join vào
  socket.on('openConversation', ({ conversation, user }) => {
    socket.join(conversation._id);
    console.log(socket.adapter.rooms);

    conversation.users.forEach((element) => {
      // ko gui lai tin nhan cho nguoi da gui
      if (element._id === user._id) {
        return;
      }
      //  chi nhung nguoi co trong room moi dc nhan chat
      socket.in(element._id).emit('openConversation', conversation);
    });
  });
  // gui doi nguyen model Message  de tao lay id join vòa room
  socket.on('sendMessage', (message) => {
    const conversation = message.conversation;
    if (!conversation) {
      return;
    }
    conversation.users.forEach((element) => {
      // ko gui lai tin nhan cho nguoi da gui
      if (element._id === message.sender._id) {
        return;
      }
      //  chi nhung nguoi co trong room moi dc nhan chat
      socket.in(element._id).emit('receivedMessage', message);
    });
  });
  // {}
  socket.on('addFriend', (message) => {
    const friend = userOnline.find((user) => user.userId === message);
    const userSend = userOnline.find((user) => user.socketId === socket.id);
    if (friend) {
      io.to(friend.socketId).emit('receivedAddFriend', `${userSend.userId} gửi lời mời kết bạn`);
    } else {
      console.log('false');
    }
  });
  socket.on('acceptFriend', (message) => {
    const friend = userOnline.find((user) => user.userId === message);
    const userSend = userOnline.find((user) => user.socketId === socket.id);
    if (friend) {
      io.to(friend.socketId).emit(
        'receivedAddFriend',
        `${userSend.userId} đã chấp thuận lời mời kết ban`
      );
    } else {
      console.log('false');
    }
  });
  // rời nhóm
  let userOnline = [];
  socket.on('online', (userId) => {
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
  // typing
  socket.on('typing', ({ conversation, userId }) => {
    socket.in(conversation._id).emit('typing', userId);

    conversation.users.forEach((element) => {
      // ko gui lai tin nhan cho nguoi da gui
      if (element._id === userId) {
        return;
      }
      //  chi nhung nguoi co trong room moi dc nhan chat
      socket.in(element._id).emit('typing', { conversationId: conversation._id, userId });
    });
  });
  // stop typing
  socket.on('stopTyping', ({ conversation, userId }) => {
    socket.in(conversation._id).emit('stopTyping', userId);

    conversation.users.forEach((element) => {
      // ko gui lai tin nhan cho nguoi da gui
      if (element._id === userId) {
        return;
      }
      //  chi nhung nguoi co trong room moi dc nhan chat
      socket.in(element._id).emit('stopTyping', { conversationId: conversation._id, userId });
    });
  });

  // Recall message
  socket.on('recallMessage', (message) => {
    const conversationId = message?.conversation?._id;
    if (!conversationId) return;

    message.conversation.users.forEach((element) => {
      if (element._id === message.sender._id) return;

      socket.in(element._id).emit('recallMessage', message);
    });
  });
};
module.exports = { socketServer };
