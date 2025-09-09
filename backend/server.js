const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookingRoutes');
const accessRoutes = require('./routes/accessRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingRoutes);
app.use('/api/request-access', accessRoutes);
app.use('/api/chatbot', chatbotRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
