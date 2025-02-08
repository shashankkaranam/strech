const express = require('express'); 
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all frontend requests

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Email Schema
const EmailSchema = new mongoose.Schema({ email: String });
const SendMail = mongoose.model('SendMail', EmailSchema, 'send_mails');
const EmailSubscriber = mongoose.model('EmailSubscriber', EmailSchema, 'email_subscribers');

// Function to decrypt email password
function decrypt(text) {
  try {
    if (!text) throw new Error("EMAIL_PASS_ENCRYPTED is missing!");
    if (!process.env.ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY is missing!");

    const algorithm = 'aes-256-ctr';
    const secretKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const [iv, encryptedText] = text.split(':');

    if (!iv || !encryptedText) throw new Error("Invalid encryption format.");

    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("❌ Error in decryption:", error.message);
    return null;
  }
}

// Set up Nodemailer with decrypted password
const decryptedPassword = decrypt(process.env.EMAIL_PASS_ENCRYPTED);
if (!decryptedPassword) {
  console.error("❌ Failed to decrypt email password. Check your ENCRYPTION_KEY.");
  process.exit(1); // Stop the server if decryption fails
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: decryptedPassword
  }
});

// Route to Subscribe and Save Email to `send_mails`
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const existingEmail = await SendMail.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    await SendMail.create({ email });
    console.log(`✅ Email ${email} added to send_mails.`);
    res.status(200).json({ message: 'Subscription successful! Email will be sent soon.' });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Function to Send Emails and Move to `email_subscribers`
const sendThankYouEmails = async () => {
  try {
    const emails = await SendMail.find();
    if (emails.length === 0) {
      console.log("🔄 No new emails to send.");
      return;
    }

    for (const user of emails) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Thank You for Subscribing!',
        text: 'We appreciate your support. Stay tuned for updates!'
      });

      await EmailSubscriber.create({ email: user.email });
      await SendMail.deleteOne({ _id: user._id });

      console.log(`✅ Email sent to ${user.email} and moved to email_subscribers.`);
    }
  } catch (error) {
    console.error("❌ Error sending emails:", error);
  }
};

// Run Every Minute
setInterval(sendThankYouEmails, 60000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
