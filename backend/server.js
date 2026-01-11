const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const { pool } = require('./config/db'); // Will be created next

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Placeholder Routes
app.get('/', (req, res) => {
  res.send('Accessible Navigation API is running');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/alerts', require('./routes/alertsRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
