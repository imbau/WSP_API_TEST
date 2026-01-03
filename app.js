const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

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

    const from = message.from; // número del usuario
    const text = message.text?.body; // mensaje que envió

    console.log("Usuario:", from);
    console.log("Mensaje:", text);

    // 👉 ACA LLAMAMOS A PYTHON
    const pythonResponse = await fetch("https://python-server-test-uod4.onrender.com/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_text: text,
        to: from
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
