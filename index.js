const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
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


// middleware for jwt
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unAuthorized Access" })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unAuthorized Access" })
    }
    req.user = decoded
    next()
  })
}


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

    //  jwt
    //creating Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);  
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      res.cookie("token", token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({ success: true });
    });

    //clearing Token
    app.get("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", { 
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
           maxAge: 0 
      })
        .send({ success: true });
    });


    //  all post jobs
    app.get('/postJobs', async (req, res) => {
      const result = await jobsCollection.find().toArray()
      res.send(result)
    });

    app.get('/postJobs/:id', verifyToken,  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result)
    });

    app.get('/jobEmail/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { 'buyer.email': email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/postJobs', async (req, res) => {
      const jobs = req.body;
      const result = await jobsCollection.insertOne(jobs);
      res.send(result)
    });

    app.put('/postJobs/:id', async (req, res) => {
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

    app.delete('/postJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result)
    })

    app.get('/jobList/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await applyCollection.find(query).toArray();
      res.send(result)
    })

    //  save apply data
    app.post('/jobList', async (req, res) => {
      const info = req.body;
      const result = await applyCollection.insertOne(info);
      const updateDoc = {
        $inc: { application_count: 1 },
      }
      const jobQuery = { _id: new ObjectId(info.jobId) }
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


app.get('/', async (req, res) => {
  res.send('welcome to my website')
})

app.listen(port, () => {
  console.log('this port is running on port', port)
})