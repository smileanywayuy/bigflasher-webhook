// index.js
const express = require('express');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();
const app = express();
app.use(express.json());

// Creează clientul Supabase cu URL + Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post('/webhook', async (req, res) => {
  const { status, order_description: email, payin_hash: tx_hash } = req.body;
  console.log('✅ Webhook primit:', req.body);

  if (status !== 'finished' || !email) {
    console.log('ℹ️ Plata nefinalizată sau email lipsă');
    return res.status(400).send('Webhook ignorat');
  }

  // Actualizează în Supabase
  const { error } = await supabase
    .from('users')                          // numele tabelului tău
    .update({
      is_premium: true,
      premium_activated_at: new Date().toISOString(),
      tx_hash
    })
    .eq('email', email);

  if (error) {
    console.error('❌ Supabase update error:', error);
    return res.status(500).send(`Eroare Supabase: ${error.message}`);
  }

  console.log(`✨ Premium activat pentru: ${email}`);
  res.status(200).send('Premium setat cu succes');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server pornit pe portul ${PORT}`));
