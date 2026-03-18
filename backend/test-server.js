const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send("Root is working"));
app.get('/test', (req, res) => res.send("Test route is working!"));

app.post('/api/generate-tags', (req, res) => {
  console.log("Received /api/generate-tags");
  res.json({ tags: ['debug', 'test', 'works'] });
});

app.listen(5000, () => console.log("Server running on port 5000"));