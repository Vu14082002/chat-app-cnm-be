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
  socket.on('openConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(socket.adapter.rooms);
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
  // rời nhóm
};
module.exports = { socketServer };
