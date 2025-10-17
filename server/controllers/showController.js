import axios from "axios"
import Movie from "../models/Movies.js";
import Show from "../models/Show.js";


//api to get nowplaying movies from tmdb api

export const getNowPlayingMovies = async (req,res) => {

    try {
       const {data} =  await axios.get(`https://api.themoviedb.org/3/movie/now_playing`,{ headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}})

       const movies = data.results;
       res.json({success: true,movies : movies})
    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
    }
}


//api to add a new show to database

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
  timeout: 10000, // 10 seconds
});

export const addShow = async(req,res) => {

    /*
    try {
        const {movieId, showsInput, showPrice} = req.body

        let movie = await Movie.findById(movieId)

        if(!movie)
        {
            //fetch movie details and credits from TMDB api
            const [movieDetailsResponse, movieCreditResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`,{ headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}}),

                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, { headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}})
            ]);

            const movieApiData = movieDetailsResponse.data;

            const movieCreditsData = movieCreditResponse.data;

            const movieDetails = {
                _id : movieId,
                title : movieApiData.title,
                overview : movieApiData.overview,
                poster_path : movieApiData.poster_path,
                backdrop_path : movieApiData.backdrop_path,
                genres : movieApiData.genres,
                casts : movieCreditsData.cast,
                release_date : movieApiData.release_date,
                original_language : movieApiData.original_language,
                tagline : movieApiData.tagline || "",
                vote_average : movieApiData.vote_average,
                runtime : movieApiData.runtime
            }

            //add movie to databse

            movie = await Movie.create(movieDetails)


            const showsToCreate = [];
            showsInput.forEach(show => {
                const showDate = show.date;
                show.time.forEach((time) => {
                    const dateTimeString = `${showDate}T${time}`;
                    showsToCreate.push({
                        movie : movieId,
                        showDateTime : new Date(dateTimeString),
                        showPrice,
                        occupiedSeats : {}
                    })
                })
            });

            if(showsToCreate.length > 0)
            {
                await Show.insertMany(showsToCreate)
            }

            res.json({success:true, message: "Show added successfully"})
        }
    } catch (error) { 
        console.log(error)
        res.json({success:false, message: error.message})
    }*/


    try {
    const { movieId, showsInput, showPrice } = req.body;

    let movie = await Movie.findById(movieId);

    if (!movie) {
      // Fetch movie details first
      const movieDetailsResponse = await tmdb.get(`/movie/${movieId}`);
      const movieApiData = movieDetailsResponse.data;

      // Then fetch credits separately (avoids socket reset)
      const movieCreditResponse = await tmdb.get(`/movie/${movieId}/credits`);
      const movieCreditsData = movieCreditResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      // Save movie
      movie = await Movie.create(movieDetails);
    }

    // Prepare show entries
    const showsToCreate = [];
    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {},
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({ success: true, message: "Show added successfully" });
  } catch (error) {
    console.error("Error adding show:", error.message);
    res.json({ success: false, message: error.message });
  }
}

//Api to get all shows from the database

export const getShows = async (req,res) => {
    try {

        console.log("Current time:", new Date());
        const shows = await Show.find().populate('movie').sort({ showDateTime: 1 });;
//console.log(shows.map(s => s.showDateTime));
        //const shows = await Show.find({showDateTime : {$gte : new Date()}}).populate('movie').sort({showDateTime : 1})

        console.log("Total shows found:", shows.length);
       
        //filter unique shows

        const uniqueShows = new Set(shows.map(show => show.movie))

        

        

       

        res.json({success : true, shows:Array.from(uniqueShows)})
    } catch (error) {
        console.error(error);
        res.json({success : false, message : error.message})
    }
}

//api to get single show from database

export const getShow = async (req,res) => {
    try {
        const {movieId} = req.params;

        //get all upcoming shows from the movie

        const shows = await Show.find({movie:movieId})

        const movie = await Movie.findById(movieId)
        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];

            if(!dateTime[date])
            {
                dateTime[date] = []
            }
            dateTime[date].push({ time : show.showDateTime, showId : show._id})

        })

        res.json({success : true,movie,dateTime})
    } catch (error) {
        console.error(error);
        res.json({success : false, message : error.message})
    }
}