const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv").config();
const URL = process.env.DB;

const DB_NAME = "movie_db";

const COLLECTION_NAME = "movies";
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/movie/get-movies", async (req, res) => {
  try {
    // Step 1. Connect the Database
    const client = new MongoClient(URL, {}).connect();

    // Step 2. Select the DB
    let db = (await client).db(DB_NAME);

    // Step 3. Select the Collection
    let collection = await db.collection(COLLECTION_NAME);

    // Step 4. Do the operation
    let movies = await collection.find({}).toArray();

    // Step 5. Close the connection
    (await client).close();

    res.json(movies);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/movie/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Step 1. Connect the Database
    const client = new MongoClient(URL, {}).connect();

    // Step 2. Select the DB
    let db = (await client).db(DB_NAME);

    // Step 3. Select the Collection
    let dbcollection = await db.collection(COLLECTION_NAME);

    let movie = await dbcollection.findOne({ _id: id });

    (await client).close();

    res.json(movie);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/movie/book-movie", async (req, res) => {
  let bookingRequest = req.body;
  /**
 * Find the movie
 * if movie is not found throw error else
 * check if the seats are available
 * Find the show and get the seat
 * If the available seat is less than requested seat a:10 r:11
 * Throw error
 * Else book the seat
 */

  // Check for missing fields
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

  // Validate seat count
  if (isNaN(requestedSeat) || requestedSeat <= 0) {
    return res.status(401).json({ message: "Invalid seat count" });
  }

  try {
    // Step 1: Connect to the database
    const client = new MongoClient(URL, {}).connect();

    // Step 2: Select the DB
    let db = (await client).db(DB_NAME);

    // Step 3: Select the collection
    let dbcollection = await db.collection(COLLECTION_NAME);

    // Find the movie by string movieId (no ObjectId conversion)
    let movie = await dbcollection.findOne({ _id: bookingRequest.movieId });

    if (!movie) {
      return res.status(404).json({ message: "Requested movie is not found" });
    }

    // Find the correct show by showId (assumed to be a string)
    const show = Object.values(movie.shows)
      .flat()
      .find((s) => s.id === bookingRequest.showId);

    if (!show) {
      return res.status(404).json({ message: "Show not Found" });
    }

    // Check if enough seats are available
    if (parseInt(show.seats) < requestedSeat) {
      return res.status(404).json({ message: "Not enough seats available" });
    }

    const updateSeats = parseInt(show.seats) - requestedSeat;

    // Find the date of the show
    const date = Object.keys(movie.shows).find((d) =>
      movie.shows[d].some((s) => s.id === bookingRequest.showId)
    );

    const showIndex = movie.shows[date].findIndex(
      (s) => s.id === bookingRequest.showId
    );

    // Prepare the user booking data
    const userBooking = {
      name: bookingRequest.name,
      email: bookingRequest.email,
      phoneNumber: bookingRequest.phoneNumber,
      seats: bookingRequest.seats,
    };

    // Update the seats and add the booking
    const updatedResult = await dbcollection.updateOne(
      {
        _id: bookingRequest.movieId, // No ObjectId conversion here
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

