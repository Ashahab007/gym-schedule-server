const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DB_USER=gymscheduledb
// DB_PASS=CzGj0NxgajzbWe50

console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bmunlsr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const gymCollections = client.db("scheduleDB").collection("schedule");

    app.post("/schedule", async (req, res) => {
      const result = await gymCollections.insertOne(req.body);
      res.send({ message: "Data inserted", data: result });
    });

    app.get("/schedule", async (req, res) => {
      const result = await gymCollections.find().toArray();
      res.send(result);
    });

    app.delete("/schedule/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gymCollections.deleteOne(query);
      res.send(result);
    });

    // 1.0 My requirement is update a single data that's why first make the get api with findOne method to get the specific id (same as delete)

    app.get("/schedule/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gymCollections.findOne(query);
      res.send(result);
    });

    // 1.2 simultaneously created the updata api put
    app.put("/schedule/:id", async (req, res) => {
      const id = req.body.id;
      // directly destructured it as we will use in $set
      const { title, day, hour, date } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title,
          day,
          hour,
          date,
        },
      };
      const result = await gymCollections.updateOne(query, updateDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Gym server is running successfully");
});

app.listen(port, () => {
  console.log(`Gym Server is running on port ${port}`);
});
