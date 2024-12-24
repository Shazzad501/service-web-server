const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middle ware
app.use(cors());
app.use(express.json())




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


    // new service post in db
    app.post('/services', async(req, res)=>{
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
    app.get('/services', async(req, res)=>{
      const email = req.query.email;
      const query = {userEmail: email};
      const cursor = servicesCollection.find(query)
      const result = await cursor.toArray();
      res.send(result);
    })

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
    app.put('/services/:id', async(req, res)=>{
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
    app.delete('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    })

    // post a review
    app.post('/reviews', async(req, res)=>{
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

    // update a review by id
    app.put('/reviews/:id', async(req, res)=>{
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
    app.delete('/reviews/:id', async(req, res)=>{
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