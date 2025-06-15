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
      // 3.0 my requirement is search gym schedule
      // 3.1 get the searchParams via a query because we are using query string
      const { searchParams } = req.query;

      // 3.1.1 took an empty query for default fetch using let
      let query = {};

      // 3.1.2 took conditional query for searchParams if searchParams contains value. As we are going to search by title so we use title in query
      if (searchParams) {
        query = { title: { $regex: searchParams, $options: "i" } };
      }
      // 3.1.3 pass the query
      const result = await gymCollections.find(query).toArray();
      res.send(result);
    });

    app.delete("/schedule/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gymCollections.deleteOne(query);
      res.send(result);
    });

    // 1.0 My requirement is update a single data that's why first make the get api with findOne method to get the specific id (same as delete).Note: if we only use put method without get method and update the any data, only new data is updated and other data shows null in db. But we want to update it with new data and send the existing data (not updated data) to the db. so first we use get method with findOne to get the id of that data.

    app.get("/schedule/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gymCollections.findOne(query);
      res.send(result);
    });

    // 1.2 then created the update api put
    app.put("/schedule/:id", async (req, res) => {
      const id = req.params.id;
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

    // 2.1 create a patch method applying upsert
    app.patch("/schedule/:id", async (req, res) => {
      const id = req.params.id;
      // directly destructured it as we will use in $set

      const query = { _id: new ObjectId(id) };
      // 2.2 update the doc but isCompleted is not previously created in db that's why to create in db with $set and then use upsert
      const updateDoc = {
        $set: {
          isCompleted: true,
        },
      };
      const result = await gymCollections.updateOne(query, updateDoc, {
        // 2.3 apply with upsert. upsert means if isCompleted is present in db it will update or if not present it will insert in db.
        upsert: true,
      });
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
