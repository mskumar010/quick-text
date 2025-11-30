// server.js
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
const messageList=[]
let currentMessage = 'No message yet';
const now = new Date();
const time = now.getHours().toString().padStart(2, "0") +
             now.getMinutes().toString().padStart(2, "0");

console.log(time); 

// GET — return message
app.get('/', (req, res) => {
	res.send('home');
});
app.get('/view/:id', (req, res) => {
	const reqId=req.params.id
	const reqItem=messageList.find((item)=>item.id==reqId)
	res.send(reqItem);
	console.log('sending :',reqItem);
});

// POST — update message
app.post('/', (req, res) => {
	const { message,id } = req.body;

	if (!message?.trim()) {
		return res.status(400).send('Message required');
	}

	currentMessage = message.trim();
	const ts=time
	messageList.push({currentMessage,id,ts})
	console.log('current message',currentMessage)
	console.log('all messages',messageList)
	res.send(currentMessage);
});

app.listen(9090, () => console.log('Server running on 9090'));
