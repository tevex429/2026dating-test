import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// PAYSTACK - VERIFICATION BADGE (KSh 300)
app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, plan } = req.body;
    if (!email || !amount) return res.status(400).json({ error: "Email and amount are required" });

    const amountInKobo = amount * 100;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return res.status(500).json({ error: "Paystack Secret Key is missing." });

    const baseUrl = req.headers.origin || 'http://localhost:3000';

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        callback_url: `${baseUrl}/?payment=success&type=verify`,
        metadata: { plan: plan, type: "verify" }
      })
    });

    const data = await response.json();
    if (!data.status) return res.status(400).json({ error: data.message });
    res.json({ authorization_url: data.data.authorization_url });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PAYSTACK - CREDITS TOP-UP (Min KSh 40)
app.post('/api/paystack/buy-credits', async (req, res) => {
  try {
    const { email, amount } = req.body;
    if (!email || !amount) return res.status(400).json({ error: "Email and amount required" });
    if (amount < 40) return res.status(400).json({ error: "Minimum deposit is KSh 40" });

    const amountInKobo = amount * 100;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const baseUrl = req.headers.origin || 'http://localhost:3000';

    // 40 Ksh = 160 credits
    const creditsToAdd = Math.floor((amount / 40) * 160);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        callback_url: `${baseUrl}/?payment=success&type=credits&credits=${creditsToAdd}`,
        metadata: { type: "credits", credits: creditsToAdd }
      })
    });

    const data = await response.json();
    if (!data.status) return res.status(400).json({ error: data.message });
    res.json({ authorization_url: data.data.authorization_url });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPLOAD
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });
    res.json({ success: true, imageUrl: image });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default app;
