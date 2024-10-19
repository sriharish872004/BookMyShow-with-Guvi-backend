const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const dotenv = require("dotenv").config();
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

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid movie ID" });
        }

        // connect the database
        const client = new MongoClient(URL,{}).connect();
        // select the db
        let db = (await client).db(DB_NAME);
        //select the collection
        let collection = await db.collection(COLLECTION_NAME);
        //do the operation 
        let movie = await collection.findOne({ _id: new ObjectId(id) });
        //close the connection
        (await client).close();

        if (!movie) {
          return res.status(404).json({ message: "Movie not found" });
        }

        res.json(movie);
}
catch(error){
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
}
});

app.post("/movie/book-movie", async (req, res) => {
    let bookingRequest = req.body;
  
    if (
      !bookingRequest.movieId ||
      !bookingRequest.showId ||
      !bookingRequest.seats ||
      !bookingRequest.name ||
      !bookingRequest.email ||
      !bookingRequest.phoneNumber
    ) {
      return res.status(401).json({ message: "Some fields are missing" });
    }
    let requestedSeat = parseInt(bookingRequest.seats);

    if (isNaN(requestedSeat) || requestedSeat <= 0) {
      return res.status(401).json({ message: "In valid seat count" });
    }
  
    try {
      // Connect the Database
      const client = new MongoClient(URL, {}).connect();
  
      // Select the DB
      let db = (await client).db(DB_NAME);
  
      // Select the Collection
      let dbcollection = await db.collection(COLLECTION_NAME);
  
      /**
       * Find the movie
       * If movie is not found throw error else
       * Check if the seats are available
       * Find the show and get the seat
       * If the available seat is less than requested seat a:10 r:11
       * Throw an error
       * Else book the seat
       */
      console.log(bookingRequest.movieId);
      let movie = await dbcollection.findOne({
        _id: new ObjectId(bookingRequest.movieId),
      });
  
      if (!movie) {
        return res.status(404).json({ message: "Requested movie is not found" });
      }
  
      const show = Object.values(movie.shows)
        .flat()
        .find((s) => s.id === bookingRequest.showId);
  
      if (!show) {
        return res.status(404).json({ message: "Show not Found" });
      }
  
      if (parseInt(show.seats) < requestedSeat) {
        return res.status(404).json({ message: "No enough seats avilable" });
      }
  
      const updateSeats = parseInt(show.seats) - requestedSeat;
  
      const date = Object.keys(movie.shows).find((d) =>
        movie.shows[d].some((s) => s.id === bookingRequest.showId)
      );
      console.log(movie.shows[date]);
      const showIndex = movie.shows[date].findIndex(
        (s) => s.id === bookingRequest.showId
      );
      console.log(showIndex);
  
      const userBooking = {
        name: bookingRequest.name,
        email: bookingRequest.email,
        phoneNumber: bookingRequest.phoneNumber,
        seats: bookingRequest.seats,
      };
  
      const updatedResult = await dbcollection.updateOne(
        {
          _id: new ObjectId(bookingRequest.movieId),
        },
        {
          $set: {
            [`shows.${date}.${showIndex}.seats`]: updateSeats,
          },
          $push: {
            [`shows.${date}.${showIndex}.bookings`]: userBooking,
          },
        }
      );
  
      if (updatedResult.modifiedCount === 0) {
        return res.status(500).json({ message: "Failed to update" });
      }
  
      return res.status(200).json({ message: "Booking created successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  });
  
  app.listen(8000);