const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
//parsers
app.use(express.json());

app.use(
  cors({
    origin: ["https://direct-relief-client1.vercel.app"],
    credentials: true,
  })
);

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const collection = db.collection("users");
    const suppliesCollection = db.collection("supplies");
    const testimonialCollection = db.collection("testimonial");
    const volunteerCollection = db.collection("volunteer");
    const commentCollection = db.collection("comment");

    // User Registration
    app.post("/api/auth/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    //volunteer registration...
    app.post("/api/volunteer", async (req, res) => {
      const { email, number, location } = req.body;
      await volunteerCollection.insertOne({ email, number, location });
      res.status(201).json({
        success: true,
        message: "Volunteer registered successfully",
      });
    });

    //get volunteer api
    app.get("/api/volunteer", async (req, res) => {
      const result = await volunteerCollection.find({}).toArray();
      if (result.length) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    // User Login
    app.post("/api/auth/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });
    //get supplies api
    app.get("/api/supplies", async (req, res) => {
      const result = await suppliesCollection.find({}).toArray();
      if (result.length) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    //get supply according to id
    app.get("/api/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const supply = await suppliesCollection.findOne(query);
      res.send(supply);
    });

    //get testimonial api
    app.get("/api/testimonial", async (req, res) => {
      const result = await testimonialCollection.find({}).toArray();
      if (result.length) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });
    //get comment api
    app.get("/api/comment", async (req, res) => {
      const result = await commentCollection.find({}).toArray();
      if (result.length) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    //supply post api
    app.post("/api/supplies", async (req, res) => {
      const supplies = req.body;
      const result = await suppliesCollection.insertOne(supplies);
      if (result.insertedId) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    //testimonial post api
    app.post("/api/testimonial", async (req, res) => {
      const testimonial = req.body;
      const result = await testimonialCollection.insertOne(testimonial);
      if (result.insertedId) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });
    //comment post api
    app.post("/api/comment", async (req, res) => {
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      if (result.insertedId) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    //update api
    app.put("/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: data,
      };
      const result = await suppliesCollection.updateOne(filter, updateDoc);
      if (result.acknowledged) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    //delete api
    app.delete("/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await suppliesCollection.deleteOne(filter);

      if (result.acknowledged) {
        res.send({ result, success: true });
      } else {
        res.send({ success: false, message: "Something went wrong" });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
