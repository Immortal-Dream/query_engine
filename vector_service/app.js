const express = require('express');
const http = require('http');
const paperRouter = require('./routes/paper');

const app = express();
app.use(express.json());
app.use('/', paperRouter);

// Port number Setting
const PORT = process.env.PORT || 10086;

// Start the http service
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});