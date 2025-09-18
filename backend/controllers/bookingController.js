
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const { sendEmail } = require('../services/emailService');

exports.createBooking = (req, res) => {
        const { day, time, studentName, studentClass, studentEmail } = req.body;
        (async () => {
            try {
                // Check if slot already booked
                const snapshot = await db.collection('bookings')
                    .where('day', '==', day)
                    .where('time', '==', time)
                    .get();
                if (!snapshot.empty) {
                    return res.status(400).json({ message: 'This time slot is already booked!' });
                }
                const createdAt = new Date().toISOString();
                const bookingRef = await db.collection('bookings').add({
                    day, time, studentName, studentClass, studentEmail, createdAt
                });
                // Send confirmation email to booker
                await sendEmail(studentEmail,
                    'Booking Confirmation',
                    `Hey ${studentName}, your booking for ${day} at ${time} is confirmed!`,
                    {
                        studentName,
                        studentClass,
                        studentEmail,
                        date: day,
                        time
                    }
                );
                // Send notification to Mr. Albert for every booking
                await sendEmail('albert.arthur@binus.edu',
                    'New Booking Notification',
                    `A new booking has been made:\n\nName: ${studentName}\nClass: ${studentClass}\nEmail: ${studentEmail}\nDay: ${day}\nTime: ${time}\nCreated At: ${createdAt}`
                );
                res.status(201).json({ id: bookingRef.id, message: 'Booking successful!' });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        })();
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
