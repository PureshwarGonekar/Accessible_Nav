const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import socket.io

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev, restrict in prod
    methods: ["GET", "POST"]
  }
});

// Make io accessible to our helpers
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Placeholder Routes
app.get('/', (req, res) => {
  res.send('Accessible Navigation API is running');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/alerts', require('./routes/alertsRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes')); // Upload Route
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/navigation', require('./routes/navigationRoutes'));

// Serve Uploads Static Folder
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

server.listen(PORT, () => { // Listen on server, not app
  console.log(`Server running on port ${PORT}`);
});
