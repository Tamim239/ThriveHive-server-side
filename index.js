const express = require('express');
const app = express();
require('dotenv').config()
const cookieParser = require('cookie-parser')
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
      "http://localhost:5173",
    //   "https://cardoctor-bd.web.app",
    //   "https://cardoctor-bd.firebaseapp.com",
    ],
    credentials: true,
  }))
app.use(express.json())
app.use(cookieParser())



app.get('/', async(req, res)=>{
    res.send('welcome to my website')
})

app.listen(port, ()=>{
    console.log('this port is running on port', port)
})