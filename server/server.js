const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = createServer(app);

const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
		credentials: false,
	},
	transports: ['websocket', 'polling'],
});

// In-memory storage (for free tier - use Redis/DB for production)
const messageStore = new Map();

// Generate readable user ID
function generateUserId() {
	const adjectives = [
		'cozy',
		'bright',
		'swift',
		'calm',
		'wild',
		'happy',
		'quiet',
		'bold',
		'fresh',
		'clever',
	];
	const nouns = [
		'sky',
		'wave',
		'leaf',
		'star',
		'moon',
		'rain',
		'wind',
		'dawn',
		'path',
		'fire',
	];

	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	const num = Math.floor(Math.random() * 100);

	return `${adj}-${noun}-${num}`;
}

io.on('connection', (socket) => {
	console.log('Client connected:', socket.id);

	// Assign a unique user ID
	const userId = generateUserId();
	socket.emit('assignedUserId', userId);
	console.log('Assigned user ID:', userId);

	// Store message from client
	socket.on('storeMessage', (data) => {
		const { userId, message } = data;
		messageStore.set(userId, message);
		console.log(`Message stored for ${userId}:`, message);

		// Optional: Set expiry (remove after 24 hours)
		setTimeout(() => {
			messageStore.delete(userId);
			console.log(`Message expired for ${userId}`);
		}, 24 * 60 * 60 * 1000); // 24 hours
	});

	// Request message by user ID
	socket.on('requestMessage', (userId) => {
		console.log('Message requested for:', userId);

		if (messageStore.has(userId)) {
			const message = messageStore.get(userId);
			socket.emit('messageResponse', { message, userId });
			console.log(`Message sent for ${userId}`);
		} else {
			socket.emit('messageNotFound');
			console.log(`No message found for ${userId}`);
		}
	});

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id);
	});
});

const PORT = process.env.PORT || 9090;
server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
});
