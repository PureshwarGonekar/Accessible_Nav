// Simple mock AI response
const sendMessage = async (req, res) => {
  const { message } = req.body;
  
  // Simulate processing delay
  setTimeout(() => {
    let reply = "I'm here to help navigate. Could you clarify?";
    
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
       reply = "Hello! I am your Accessible Navigation Assistant. How can I help you today?";
    } else if (message.toLowerCase().includes('help')) {
       reply = "I can help you find routes, avoid obstacles, or update your profile settings.";
    } else if (message.toLowerCase().includes('route') || message.toLowerCase().includes('go')) {
       reply = "To find a route, please use the Navigation tab. I can provide updates as you move.";
    } else if (message.toLowerCase().includes('obstacle') || message.toLowerCase().includes('construction')) {
       reply = "I will check for reported obstacles in your vicinity and alert you.";
    } else {
       reply = `I received your message: "${message}". As an AI, I'm learning to support more complex queries.`;
    }

    res.json({ reply });
  }, 1000); 
  // Note: wrapped in Promise/await in real app if using external API. 
  // Express doesn't like setTimeout holding the response like this without care, 
  // but for simple one-shot it works. 
  // Actually, better to just return immediately for reliability in this demo structure.
};

// Re-write to use proper async if we were calling OpenAI
// For now, simply return JSON
const sendMessageSimple = (req, res) => {
  const { message } = req.body;
  
  let reply = "I'm here to help navigate.";
  const lowerMsg = message?.toLowerCase() || "";

  if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      reply = "Hello! I am your Accessible Navigation Assistant. How can I help you today?";
  } else if (lowerMsg.includes('help')) {
      reply = "I can help you find routes, avoid obstacles, or update your profile settings.";
  } else if (lowerMsg.includes('route') || lowerMsg.includes('go')) {
      reply = "To find a route, please use the Navigation tab or ask me to 'find a route to [Destination]'.";
  } else if (lowerMsg.includes('hazard') || lowerMsg.includes('obstacle')) {
      reply = "I'm scanning for hazards. Please check the 'Obstacle Alerts' tab for the latest updates.";
  } else {
      reply = `I heard: "${message}". I can help with navigation, hazards, and accessibility settings.`;
  }

  res.json({ reply, timestamp: new Date() });
};

module.exports = { sendMessage: sendMessageSimple };
