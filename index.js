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



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uj1q2ho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
       const jobsCollection = await client.db('thrivehive').collection('services')
       const applyCollection = await client.db('thrivehive').collection('applyList')

      //  all post jobs
       app.get('/postJobs', async(req, res) =>{
        const result = await jobsCollection.find().toArray()
        res.send(result) 
       });

       app.get('/postJobs/:id', async(req, res) =>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id)};
        const result = await jobsCollection.findOne(query);
        res.send(result)
       });

       app.get('/jobEmail/:email', async(req, res) =>{
        const email =req.params.email;
        const query = { 'buyer.email' : email};
        const result = await jobsCollection.find(query).toArray();
        res.send(result)
       })
   
       app.post('/postJobs',  async(req,res)=>{
        const jobs = req.body;
        const result = await jobsCollection.insertOne(jobs) ;
        res.send(result)
       });

       app.put('/postJobs/:id', async(req, res) =>{
        const id = req.params.id
        const jobData = req.body
        const query = { _id: new ObjectId(id) }
        const options = { upsert: true }
        const updateDoc = {
          $set: {
           ...jobData
          },
        }
        const result = await jobsCollection.updateOne(query, updateDoc, options);
        res.send(result)
       })

       app.delete('/postJobs/:id', async(req, res)=>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id)};
        const result = await jobsCollection.deleteOne(query);
        res.send(result)
       })
      //  get data apply jobs
   app.get('/jobList', async(req, res)=>{
    const cursor = await applyCollection.find().toArray();
    res.send(cursor)
   })


      app.get('/jobList/:email', async(req, res)=>{
          const email = req.params.email;
          const query = { email};
          const result = await applyCollection.find(query).toArray();
          res.send(result)
      })

      //  save apply data
      app.post('/jobList', async(req, res)=>{
        const info = req.body;
        const result = await applyCollection.insertOne(info);
        const updateDoc = {
          $inc: { application_count: 1 },
        }
        const jobQuery = { _id: new ObjectId(info.jobId)}
        const updateBidCount = await jobsCollection.updateOne(jobQuery, updateDoc)
        console.log(updateBidCount)
        res.send(result)
      });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req, res)=>{
    res.send('welcome to my website')
})

app.listen(port, ()=>{
    console.log('this port is running on port', port)
})