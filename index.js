const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

require("dotenv").config();
const URL = process.env.DB;

const DB_NAME = "movie_db";
const COLLECTION_NAME = "movies";

app.use(cors({
    origin : "*"
}));



app.get("/movie/get-movies", async (req,res) => {

    try{
            // connect the database
            const client = new MongoClient(URL,{}).connect();
            // select the db
            let db = (await client).db(DB_NAME)
            //select the collection
            let collection = await db.collection(COLLECTION_NAME);
            //do the operation 
            let movies = await collection.find({}).toArray();
            //close the connection
          (await client).close();

 res.json(movies);
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

app.get("/movie/:id", async (req,res) => {
    
    try{
        const id  = req.params.id;
        // connect the database
        const client = new MongoClient(URL,{}).connect();
        // select the db
        let db = (await client).db(DB_NAME);
        //select the collection
        let dbcollection = await db.collection(COLLECTION_NAME);
        //do the operation 
        let movie = await dbcollection.findOne({ _id : new ObjectId(id) });
        //close the connection
        (await client).close();

        res.json(movie);
}
catch(error){
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
}
});

app.post("/book-ticket", (req,res) => {

});

app.listen(4000);