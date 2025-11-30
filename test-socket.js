const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';

async function test() {
  try {
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    
    // 0. Register
    console.log(`Registering user ${email}...`);
    await axios.post(`${API_URL}/auth/signup`, {
      email,
      password,
      name: 'Test User'
    });
    console.log('User registered.');

    // 1. Login to get token
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    const token = loginRes.data.access_token;
    const user = loginRes.data.user;
    const userId = user._id || user.id;
    const userName = user.name;
    console.log('Logged in. Token:', token.substring(0, 20) + '...');
    console.log('User ID:', userId);

    // 2. Create a room
    console.log('Creating room...');
    const roomRes = await axios.post(`${API_URL}/rooms`, {
      name: 'Test Room',
      deckType: 'fibonacci'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const roomId = roomRes.data._id || roomRes.data.id;
    console.log('Room created:', roomId);

    // 3. Connect Socket
    console.log('Connecting socket...');
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` }
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);

      // 4. Join Room
      console.log('Joining room...');
      const joinPayload = {
        roomId: roomId,
        userId: userId,
        name: userName
      };
      console.log('Join payload:', joinPayload);
      socket.emit('joinRoom', joinPayload);
    });

    socket.on('roomUpdated', (room) => {
      console.log('SUCCESS: Room updated event received!');
      console.log('Participants:', room.participants);
      socket.disconnect();
      process.exit(0);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Timeout
    setTimeout(() => {
      console.log('Timeout waiting for roomUpdated');
      socket.disconnect();
      process.exit(1);
    }, 5000);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

test();
