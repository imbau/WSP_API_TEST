const express = require('express');
const app = express();
app.use(express.json());

const conversationStart = new Map();
const MAX_SECONDS = 5 * 60; // 5 minutos

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// GET - Verificación Webhook
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// POST - Mensajes de WhatsApp
app.post('/', async (req, res) => {
  console.log("Webhook recibido");
  console.log(JSON.stringify(req.body, null, 2));
  
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    
    if (!message) {
      return res.sendStatus(200);
    }
    
    const from = message.from;
    const text = message.text?.body;
    const timestamp = Number(message.timestamp); // UNIX timestamp

    // ⏱️ CONTROL DE TIEMPO
    if (!conversationStart.has(from)) {
      conversationStart.set(from, timestamp);
    }
    
    const start = conversationStart.get(from);
    const now = Math.floor(Date.now() / 1000);
    const expired = (now - start) > MAX_SECONDS;
    
    console.log("Inicio conversación:", start);
    console.log("Ahora:", now);
    console.log("Expirada:", expired);
    
    console.log("Usuario:", from);
    console.log("Mensaje:", text);
    
    // Llamar a Python
    const pythonResponse = await fetch("https://python-server-test-uod4.onrender.com/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_text: text,
        user_number: from,
        expired: expired
      })
    });
    
    const data = await pythonResponse.json();
    console.log("Respuesta Python:", data);
    
  } catch (err) {
    console.error("Error:", err);
  }
  
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
