const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { scheduleTaskCompletion } = require('./jobs/taskScheduler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/', (req, res) => {
  res.json({ message: 'Task Manager API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize task scheduler for automatic task completion
  scheduleTaskCompletion();
});
