const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const data = req.body;

  console.log('✅ Webhook primit:', data);

  const status = data.status;
  const email = data.order_description; // email-ul din webhook
  const payinHash = data.payin_hash;

  if (status === 'finished' && email) {
    try {
      // PATCH pe tabela profiles pentru a activa premium
      const response = await axios.patch(
        `${process.env.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`,
        {
          is_premium: true,
          premium_activated_at: new Date().toISOString(),
          tx_hash: payinHash || null
        },
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
      if (error.response) {
        console.error('❌ Eroare Supabase status:', error.response.status);
        console.error('❌ Eroare Supabase data:', error.response.data);
      } else {
        console.error('❌ Eroare Supabase:', error.message || error);
      }
      return res.status(500).send('Eroare la actualizare Supabase');
    }
  } else {
    console.log('ℹ️ Plata nefinalizată sau email lipsă');
    return res.status(400).send('Webhook ignorat');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook server pornit pe portul ${PORT}`));
