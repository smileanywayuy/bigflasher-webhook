const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const { payment_status, order_description: email } = req.body;
  console.log('✅ Webhook primit:', req.body);

  if (payment_status === 'finished' && email) {
    try {
      // Activăm is_premium=true în profiles
      await axios.patch(
        `${process.env.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`,
        { is_premium: true },
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
      return res.status(200).send('Premium setat cu succes');
    } catch (error) {
      if (error.response) {
        console.error('❌ Supabase update status:', error.response.status);
        console.error('❌ Supabase update data:', error.response.data);
      } else {
        console.error('❌ Supabase error:', error.message || error);
      }
      return res.status(500).send('Eroare la actualizare Supabase');
    }
  }

  console.log('ℹ️ Plata nefinalizată sau email lipsă');
  res.status(400).send('Webhook ignorat');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook server pornit pe portul ${PORT}`));
