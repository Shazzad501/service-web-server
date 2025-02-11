const express = require('express');
const cors = require('cors');
const app = express()
// jwt token relted
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middle ware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://service-review-5ac25.web.app",
    "hhttps://service-review-5ac25.firebaseapp.com"
  ],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json())

// jwt token verify middle ware
const verifyToken = (req, res, next)=>{
  const token = req?.cookies?.token;

  if(!token){
    return res.status(401).send({message: "Unauthorized access"})
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: "Unauthorized access"})
    }
    req.user = decoded;
    next()
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wlddb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const servicesCollection = client.db('serviceReviewDB').collection('services')
    const reviewsCollection = client.db('serviceReviewDB').collection('reviews')


     // Auth related api  cookie
     app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });
      res.send({ success: true });
    });

    // clear cookie
    app.post('/logout', (req, res)=>{
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({success: true})
    })

    // new service post in db
    app.post('/services', verifyToken, async(req, res)=>{
      const newService = req.body;
      const result = await servicesCollection.insertOne(newService);
      res.send(result);
    })

    // get all service from db
    app.get('/services', async(req, res)=>{
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // get service by email
    // app.get('/services', async(req, res)=>{
    //   const email = req.query.email;
    //   const query = email ? {userEmail: email} : {};
    //   const result = await servicesCollection.find(query).toArray();
    //   res.send(result);
    // })

    // only 6 service get into the db
    app.get('/limitService', async(req, res)=>{
      const cursor = servicesCollection.find().limit(6)
      const result= await cursor.toArray();
      res.send(result)
    })

    // get only one service call by id
    app.get('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await servicesCollection.findOne(query);
      res.send(result);
    })

    // update a service by id
    app.put('/services/:id', verifyToken, async(req, res)=>{
      const id = req.params.id;
      const filterd = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updateService = req.body;
      const service={
        $set: {
          serviceImage:updateService.serviceImage,
          serviceTitle:updateService.serviceTitle, 
          companyName:updateService.companyName, 
          website:updateService.website, 
          description:updateService.description, 
          category:updateService.category, 
          price:updateService.price
        }
      }
      const result = await servicesCollection.updateOne(filterd,service, options);
      res.send(result)
    })

    // Delete a service by id
    app.delete('/services/:id',verifyToken, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    })

    // post a review
    app.post('/reviews', verifyToken, async(req, res)=>{
      const newReview = req.body;
      const result = await reviewsCollection.insertOne(newReview);
      res.send(result)
    })

    // get review by spacifice service
    app.get('/reviews/:serviceId', async(req, res)=>{
      const { serviceId } = req.params;
      const reviews = await reviewsCollection.find({ serviceId: serviceId }).toArray();
      res.send(reviews);
    })

    // get review by user email
    app.get('/reviews', async(req, res)=>{
      const email = req.query.email;
      const query = { userEmail: email}
      const cursor = reviewsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    // get all review 
    app.get('/all-review', async(req, res)=>{
      const result =  await reviewsCollection.find().toArray();
      res.send(result);
    })

    // update a review by id
    app.put('/reviews/:id', verifyToken, async(req, res)=>{
      const id = req.params.id;
      const filterd = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updateReview = req.body;
      const review={
        $set: {
          text:updateReview.text,
          rating:updateReview.rating, 
        }
      }
      const result = await reviewsCollection.updateOne(filterd, review, options);
      res.send(result) 
    })

    // delete a review by id
    app.delete('/reviews/:id', verifyToken, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
  res.send("All Services Are Here!!✌️✌️")
})

app.listen(port, ()=>{
  console.log(`Service waiting on port: ${port}`)
})