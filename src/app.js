const express = require('express');
const cookieParser = require('cookie-parser');
require("dotenv").config();
const router = require("./routes");

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(router);

app.get('/ping', (req, res) => {
    res.status(200).json({
        code: 200,
        message: 'Success',
    });
});


app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
