const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const app = express();
dotenv.config();

app.use(express.json());

app.post('/webhook', async (req, res) => {
  const data = req.body;

  console.log('✅ Webhook primit:', data);

  const status = data.status;
  const email = data.order_description; // AICI e emailul
  const payinHash = data.payin_hash;

  if (status === 'finished' && email) {
    try {
      // Actualizează utilizatorul în Supabase pe baza emailului
      const response = await axios.patch(
        `${process.env.SUPABASE_URL}/rest/v1/users?email=eq.${email}`,
        { is_premium: true, premium_activated_at: new Date().toISOString(), tx_hash: payinHash },
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          }
        }
      );

      console.log(`✨ Premium activat pentru: ${email}`);
      return res.status(200).send('Premium activat cu succes');
    } catch (error) {
      console.error('❌ Eroare Supabase:', error.response?.data || error.message);
      return res.status(500).send('Eroare la actualizare Supabase');
    }
  } else {
    console.log('ℹ️ Plata nefinalizată sau email lipsă');
    return res.status(400).send('Webhook ignorat');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook server pornit pe portul ${PORT}`));
