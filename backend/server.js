const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello from backend!'));

app.listen(4000, '0.0.0.0', () => {
  console.log('Server listening on port 4000');
});
