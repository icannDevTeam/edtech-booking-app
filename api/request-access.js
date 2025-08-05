import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// You may need to adapt the import below to your project structure
import { sendEmail } from '../backend/services/emailService.js';

// Initialize Firebase Admin SDK (runs only once per cold start)
const app = initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  const { email } = req.body;
  if (!email || !email.endsWith('@binus.edu')) {
    res.status(400).json({ message: 'Only BINUSIAN emails allowed.' });
    return;
  }
  // Check if user already exists
  const teachersRef = db.collection('teachers');
  const existing = await teachersRef.where('email', '==', email).get();
  if (!existing.empty) {
    res.status(409).json({ message: 'User already exists. Please login.' });
    return;
  }
  // Generate password
  const password = Math.random().toString(36).slice(-10);
  // Store user in Firestore
  await teachersRef.add({
    email,
    password,
    createdAt: new Date().toISOString(),
  });
  // Send password email
  await sendEmail(
    email,
    'Your Teacher Portal Access',
    `Welcome! Your password for the Teacher Portal is: ${password}`,
    { teacherEmail: email, password }
  );
  res.status(201).json({ message: 'Access granted. Password sent to your email.' });
}
