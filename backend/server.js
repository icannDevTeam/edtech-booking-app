const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookingRoutes');
const accessRoutes = require('./routes/accessRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingRoutes);
app.use('/api/request-access', accessRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
