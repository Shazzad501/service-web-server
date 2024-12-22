const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;


// middle ware
app.use(cors());
app.use(express.json())

app.get('/', (req, res)=>{
  res.send("All Services Are Here!!✌️✌️")
})

app.listen(port, ()=>{
  console.log(`Service waiting on port: ${port}`)
})