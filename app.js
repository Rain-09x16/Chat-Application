const socket = io();

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const joinBtn = document.getElementById('joinBtn');
const sendBtn = document.getElementById('sendBtn');
const leaveBtn = document.getElementById('leaveBtn');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');
const roomName = document.getElementById('roomName');
const usersDiv = document.getElementById('users');

let username, room;

joinBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  room = roomInput.value.trim();

  if (username && room) {
    socket.emit('joinRoom', { username, room }, (response) => {
      if (response?.error) {
        alert(response.error);
      } else {
        loginDiv.style.display = 'none';
        chatDiv.style.display = 'block';
        roomName.textContent = `Room: ${room}`;
      }
    });
  }
});

sendBtn.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('sendMessage', { room, message, username });
    messageInput.value = '';
  }
});

socket.on('message', ({ user, text, time }) => {
  const messageDiv = document.createElement('div');

  // Parse the text for basic formatting
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold: **text**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')           // Italics: *text*
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>'); // Links

  messageDiv.innerHTML = `<strong>${user}</strong> [${time}]: ${formattedText}`;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('roomData', ({ users }) => {
  usersDiv.textContent = `Users: ${users.join(', ')}`;
});

const roomListDiv = document.createElement('div');
roomListDiv.id = 'roomList';
loginDiv.appendChild(roomListDiv);

// Listen for the list of available rooms from the server
socket.on('availableRooms', (rooms) => {
  roomListDiv.innerHTML = '<h3>Available Rooms:</h3>';
  if (rooms.length === 0) {
    roomListDiv.innerHTML += '<p>No rooms available. Create one!</p>';
  } else {
    rooms.forEach((room) => {
      const roomButton = document.createElement('button');
      roomButton.textContent = room;
      roomButton.addEventListener('click', () => {
        roomInput.value = room; 
      });
      roomListDiv.appendChild(roomButton);
    });
  }
});

leaveBtn.addEventListener('click', () => {
  socket.emit('leaveRoom', { username, room }, () => {
    chatDiv.style.display = 'none';
    loginDiv.style.display = 'block';
    roomInput.value = ''; 
    messagesDiv.innerHTML = '';
    usersDiv.textContent = ''; 
    roomName.textContent = ''; 
  });
});