const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const port = process.env.PORT || 5000;
// passing json
app.use(express.json())
app.use(cors())

// setup routing
app.get('/', (req, res) => {
    res.send('Hello world')
})

// set not found handlers
app.use((req, res, next) => {
    res.status(404).json({
        msg: "page was not found"
    })
})

//  set default error handlers
app.use((err, req, res, next) => {
    console.log('default error')
})

// start server
app.listen(port, (err) => {
    if (!err) {
        console.log(`server running port ${port}...`)
    }
})


