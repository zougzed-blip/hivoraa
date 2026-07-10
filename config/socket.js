const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: ['http://localhost:5000', 'http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Rejoindre une room de groupe d'etude
    socket.on('joinGroup', (groupId) => {
      socket.join(`group-${groupId}`);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    });

    // Quitter une room de groupe d'etude
    socket.on('leaveGroup', (groupId) => {
      socket.leave(`group-${groupId}`);
      console.log(`Socket ${socket.id} left group ${groupId}`);
    });

    // Rejoindre sa room utilisateur privee
    socket.on('joinUser', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined user room ${userId}`);
    });

    // Quitter sa room utilisateur
    socket.on('leaveUser', (userId) => {
      socket.leave(`user-${userId}`);
      console.log(`Socket ${socket.id} left user room ${userId}`);
    });

 
    socket.on('joinTalentConversation', ({ talentId, currentUserId, otherUserId }) => {
      if (!talentId || !currentUserId || !otherUserId) return;

      const participantIds = [currentUserId.toString(), otherUserId.toString()].sort();
      const room = `talent-${talentId}-conv-${participantIds[0]}-${participantIds[1]}`;

      socket.join(room);
      console.log(`Socket ${socket.id} joined conversation room ${room}`);
    });

    socket.on('leaveTalentConversation', ({ talentId, currentUserId, otherUserId }) => {
      if (!talentId || !currentUserId || !otherUserId) return;

      const participantIds = [currentUserId.toString(), otherUserId.toString()].sort();
      const room = `talent-${talentId}-conv-${participantIds[0]}-${participantIds[1]}`;

      socket.leave(room);
      console.log(`Socket ${socket.id} left conversation room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized.');
  return io;
};

module.exports = { initSocket, getIO };