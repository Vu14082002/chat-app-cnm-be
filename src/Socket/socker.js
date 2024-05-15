let userOnline = [];
const friendsByUser = {};
const calls = {};

const socketServer = (socket, io) => {
  socket.on('online', ({ userId, friendIds }) => {
    if (!userId || !Array.isArray(friendIds)) return;

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

    friendsByUser[userId] = friendIds;

    const onlineIds = [];
    friendIds.forEach((friendId) => {
      socket.in(friendId).emit('userOnline', userId);
      onlineIds.push(friendId);
    });
    io.in(userId).emit('usersOnline', onlineIds);
  });

  // Xử lý sự kiện ngắt kết nối
  socket.on('disconnect', () => {
    let userId = '';

    // Lọc ra người dùng đã ngắt kết nối và cập nhật lại danh sách
    userOnline = userOnline.filter((u) => {
      if (u.socketId === socket.id) {
        if (typeof u.userId === 'string') userId = u.userId;
        return false;
      }
      return true;
    });

    const friendIds = friendsByUser[userId] || [];

    friendIds.forEach((friendId) => {
      socket.in(friendId).emit('userOffline', userId);
    });

    delete friendsByUser[userId];
  });
  // tạo room socket và join vào
  socket.on('openConversation', ({ conversation, user }) => {
    socket.join(conversation._id);

    conversation.users.forEach((element) => {
      // ko gui lai tin nhan cho nguoi da gui
      if (element._id === user._id) {
        return;
      }
      //  chi nhung nguoi co trong room moi dc nhan chat
      socket.in(element._id).emit('openConversation', conversation);
    });
  });

  // Delete conversation: nhận conversationId và userIds, gửi đến các user trong userIds
  socket.on('deleteConversation', ({ _id, userIds, userId }) => {
    if (!_id || !userIds?.length) return;

    userIds.forEach((uId) => {
      if (uId === userId) return;
      socket.in(uId).emit('deleteConversation', { _id });
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
  socket.on('forward', (messages) => {
    messages.forEach((message) => {
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
  });
  // socket.on('forwardMessage', async ({ conversation, message }) => {
  //   const conversation = message.conversation;
  //   if (!conversation) {
  //     return;
  //   }
  //   conversation.users.forEach((element) => {
  //     if (element._id === message.sender._id) {
  //       return;
  //     }
  //     socket.in(element._id).emit('receivedMessage', message);
  //   });
  // });
  // {}
  socket.on('addFriend', (message) => {
    const friend = userOnline.find((user) => user.userId === message);
    const userSend = userOnline.find((user) => user.socketId === socket.id);
    if (friend) {
      io.to(friend.socketId).emit('receivedAddFriend', `${userSend.userId} gửi lời mời kết bạn`);
    } else {
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
    }
  });
  // rời nhóm
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

  // Pin message
  socket.on('pinMessage', ({ users, message, userId }) => {
    const conversationId = message?.conversation?._id;
    if (!conversationId || !users?.length) return;

    users.forEach((element) => {
      if (element._id === userId) return;

      socket.in(element._id).emit('pinMessage', { message });
    });
  });

  // Unpin message
  socket.on('unpinMessage', ({ users, message, userId }) => {
    const conversationId = message?.conversation?._id;
    if (!conversationId || !users?.length) return;

    users.forEach((element) => {
      if (element._id === userId) return;

      socket.in(element._id).emit('unpinMessage', { message });
    });
  });

  // React for message
  socket.on('reactForMessage', ({ users, conversationId, messageId, react, userId }) => {
    if (!conversationId || !users?.length) return;

    users.forEach((element) => {
      if (element._id === userId) return;

      socket.in(element._id).emit('reactForMessage', { conversationId, messageId, react, userId });
    });
  });

  /**
   * Friend request
   * Lấy kết quả trả về từ server và thay: receiver_id thành thông tin user đang đăng nhập
   * sender_id thành: receiver_id._id của người kết bạn
   */
  socket.on('sendFriendRequest', (friendRequest) => {
    if (!friendRequest) return;

    socket.in(friendRequest.receiver_id).emit('sendFriendRequest', friendRequest);
  });

  // Accept friend
  socket.on('acceptFriend', ({ _id, user, senderId }) => {
    if (!_id || !user || !senderId) return;

    socket.in(senderId).emit('acceptFriend', { _id, user });
  });

  // Reject friend
  socket.on('rejectFriend', ({ _id, senderId }) => {
    if (!_id || !senderId) return;

    socket.in(senderId).emit('rejectFriend', { _id });
  });

  // revocation Request Friend
  socket.on('revocationRequestFriend', ({ _id, receivedId, senderId }) => {
    if (!_id || !senderId) return;

    socket.in(senderId).emit('revocationRequestFriend', { _id, receivedId });
  });

  // Delete friend
  socket.on('deleteFriend', ({ receiverId, senderId }) => {
    if (!receiverId || !senderId) return;

    socket.in(receiverId).emit('deleteFriend', { senderId });
  });

  // Add user to conversation
  socket.on('addOrUpdateConversation', ({ conversation, userIds }) => {
    if (!conversation || !userIds?.length) return;

    userIds.forEach((element) => {
      socket.in(element).emit('addOrUpdateConversation', { conversation });
    });
  });

  socket.on('removeUserFromConversation', ({ conversationId, userId }) => {
    if (!conversationId || !userId) return;

    socket.in(userId).emit('removeUserFromConversation', { conversationId });
  });

  // Add to groups
  socket.on('addToGroups', ({ conversations, userId }) => {
    if (!conversations || !userId) return;

    socket.in(userId).emit('addToGroups', { conversations });
  });

  // Add notification message
  socket.on('addNotificationMessage', ({ userIds, message }) => {
    if (!userIds?.length || !message) return;

    userIds.forEach((element) => {
      socket.in(element).emit('addNotificationMessage', { message });
    });
  });

  // Call....
  socket.on('call', ({ sender, users, type, _id, conversationName }) => {
    if (!users?.length) return;

    users.forEach((user) =>
      socket.in(user._id).emit('call', { sender, users, type, _id, conversationName })
    );

    const id = setTimeout(() => {
      const call = calls[_id];
      if (!call) return;

      const { users, acceptUserIds, rejectUserIds, endedUserIds, busyUserIds } = call;
      const missedUserIds = users.reduce((missedUserIds, user) => {
        if (
          !acceptUserIds.includes(user._id) &&
          !rejectUserIds.includes(user._id) &&
          !endedUserIds.includes(user._id) &&
          !busyUserIds.includes(user._id)
        )
          missedUserIds.push(user._id);
        return missedUserIds;
      }, []);

      call.missedUserIds = missedUserIds;
      users.forEach((user) => io.in(user._id).emit('missedCall', { missedUserIds, _id }));
    }, 30000);

    calls[_id] = {
      sender,
      users,
      type,
      acceptUserIds: [sender._id],
      rejectUserIds: [],
      endedUserIds: [],
      busyUserIds: [],
      missedUserIds: [],
      timeoutId: id,
      conversationName,
    };
  });

  socket.on('acceptCall', ({ receiver, _id }) => {
    if (!receiver || !calls[_id]) return;

    calls[_id].users.forEach((user) => socket.in(user._id).emit('acceptCall', { receiver, _id }));
    if (!calls[_id]) return;
    calls[_id].acceptUserIds.push(receiver._id);
  });

  socket.on('rejectCall', ({ sender, _id }) => {
    if (!calls[_id]) return;

    calls[_id].users.forEach((user, _index, users) =>
      socket.in(user._id).emit('rejectCall', { sender, _id, users })
    );
    calls[_id].rejectUserIds.push(sender._id);
  });

  socket.on('busyCall', ({ sender, _id }) => {
    const call = calls[_id];

    if (!call) return;

    call.users.forEach((user) => {
      if (user._id === sender._id) return;
      socket.in(user._id).emit('busyCall', { sender, _id });
    });
    call.busyUserIds.push(sender._id);
  });

  socket.on('endCall', ({ sender, _id }) => {
    const call = calls[_id];

    if (!call) return;

    call.users.forEach((user, _index, users) =>
      socket.in(user._id).emit('endCall', { sender, _id, users })
    );
    call.endedUserIds.push(sender._id);
    call.acceptUserIds = call.acceptUserIds.filter((id) => id !== sender._id);

    if (call.acceptUserIds.length === 0) {
      clearTimeout(call.timeoutId);

      delete call;
    }
  });
};

module.exports = { socketServer };
