const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // ✅ Move this here

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Generate current timestamp in M-Pesa format
function getTimestamp() {
  const now = new Date();
  return now.getFullYear().toString() +
         String(now.getMonth() + 1).padStart(2, '0') +
         String(now.getDate()).padStart(2, '0') +
         String(now.getHours()).padStart(2, '0') +
         String(now.getMinutes()).padStart(2, '0') +
         String(now.getSeconds()).padStart(2, '0');
}

// STK Push Endpoint
app.post('/api/stkpush', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone number and amount are required." });
  }

  try {
    const auth = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const accessToken = tokenResponse.data.access_token;

    const timestamp = getTimestamp();
    const shortCode = process.env.BUSINESS_SHORTCODE;
    const passkey = process.env.PASSKEY;
    const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

    const stkBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: 'CompanyXLTD',
      TransactionDesc: 'Payment of X'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('STK Push initiated:', response.data);

    res.status(200).json({
      message: 'STK Push initiated',
      response: response.data
    });

  } catch (error) {
    console.error('M-Pesa STK error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to initiate STK push',
      details: error.response?.data || error.message
    });
  }
});

// Optional: STK Callback Handler
app.post('/api/callback', (req, res) => {
  console.log('STK Callback received:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ message: 'Callback received successfully' });
});



// Serve frontend (Render or local)
app.use(express.static(path.join(__dirname, 'frontend')));

// Default route to serve the main frontend page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'donate.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
