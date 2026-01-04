app.post('/', async (req, res) => {
  console.log("Webhook recibido");
  
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    
    if (!message) {
      return res.sendStatus(200);
    }
    
    const from = message.from;
    const text = message.text?.body;
    
    console.log("Usuario:", from);
    console.log("Mensaje:", text);
    
    // Llamar a Python con el campo correcto
    const pythonResponse = await fetch("https://python-server-test-uod4.onrender.com/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_text: text,
        user_number: from  // ← corregido
      })
    });
    
    const data = await pythonResponse.json();
    console.log("Respuesta Python:", data);
    
  } catch (err) {
    console.error("Error:", err);
  }
  
  res.sendStatus(200);
});
