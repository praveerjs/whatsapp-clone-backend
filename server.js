//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1532054",
    key: "15f5b5cc6cdbe9d4029a",
    secret: "78efe6383484cbdfc522",
    cluster: "ap2",
    useTLS: true
  });

//middleware
app.use(express.json());

//CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
app.use(cors());


//Database config
mongoose.set("strictQuery", false);
const dbConnection =
  "mongodb+srv://admin:rthG04VKikvpCmlk@cluster0.6e0yce1.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(dbConnection, (err) => {
  if (!err) console.log("Database connected");
  else console.log("db error",err);
});

//mongoose.connection changeStream .... pusher 
const db = mongoose.connection
db.once('open', () => {
    console.log("DB is connected");

    const msgCollection = db.collection
    ('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', change => {
        console.log("A change occured", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                Message: messageDetails.message,
                name: messageDetails.name,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
});

//??
//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
    // console.log("called");

  Messages.find((err, data) => {
    if (err) {
        // console.log("error",err)
      res.status(500).send(err); //internal server error need to find
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
    // console.log("called");
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
        // console.log("error",err)
      res.status(500).send(err); //internal server error need to find
    } else {
      res.status(201).send(data);
    }
  });
});
//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
