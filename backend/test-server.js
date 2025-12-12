const express = require('express');
const app = express();
const PORT = 5000;

console.log('Starting test server...');

app.get('/', (req, res) => {
    res.json({ message: 'Test server is working!' });
});

app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
});