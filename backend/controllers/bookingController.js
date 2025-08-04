const db = require('../db');
const { sendEmail } = require('../services/emailService');

exports.createBooking = (req, res) => {
    const { day, time, studentName, studentClass, studentEmail } = req.body;

    // Check if slot already booked
    db.get(`SELECT * FROM bookings WHERE day = ? AND time = ?`, [day, time], (err, row) => {
        if (row) {
            return res.status(400).json({ message: 'This time slot is already booked!' });
        }

        const createdAt = new Date().toISOString();
        db.run(
            `INSERT INTO bookings (day, time, studentName, studentClass, studentEmail, createdAt)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [day, time, studentName, studentClass, studentEmail, createdAt],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // Send confirmation email to teacher and booker
                sendEmail(studentEmail, 'Booking Confirmation', 
                    `Hey ${studentName}, your booking for ${day} at ${time} is confirmed!`);
                
                sendEmail(process.env.ADMIN_EMAIL, 'New Booking Alert', 
                    `${studentName} (${studentClass}) booked ${day} at ${time}`);

                res.status(201).json({ id: this.lastID, message: 'Booking successful!' });
            }
        );
    });
};

exports.getBookings = (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.overrideAvailability = (req, res) => {
    const { day, time } = req.body;
    db.run(`DELETE FROM bookings WHERE day = ? AND time = ?`, [day, time], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Slot ${time} on ${day} has been cleared.` });
    });
};
