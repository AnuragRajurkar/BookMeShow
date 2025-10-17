//api controller function to get user bookings

import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movies.js";


export const getUserBookings = async (req,res) => {
    try {
        const user = req.auth().userId;
        const bookings = await Booking.find({user}).populate({
            path : "show",
            populate : {path : 'movie'}
        }).sort({createdAt : -1})

        res.json({success : true, bookings})
    } catch (error) {
        console.log(error.message)
        res.json({success : false, message : error.message})
    }
}


//controller function to add movie in favorite list

//Api controller funtion to update favorite movie in clerk user metadata

export const updateFavorite = async (req,res) => {

    try {
        const {movieId} = req.body;
        const userId = req.auth().userId

        const user = await clerkClient.users.getUser(userId)

        if(!user.privateMetadata.favorites)
        {
            user.privateMetadata.favorites = []
        }

        if(!user.privateMetadata.favorites.includes(movieId))
        {
            user.privateMetadata.favorites.push(movieId)
        }else{
            //we have to remove this movieid from this array so we are using filter method
            user.privateMetadata.favorites.filter(item => item !==  movieId)
        }

        //it will update in clerk metadata
        await clerkClient.users.updateUserMetadata(userId, {privateMetadata : user.privateMetadata})

        res.json({success : true, message : "favorite movies updated"})
    } catch (error) {
        console.log(error.message)
        res.json({success : false, message : error.message})
    }
}


//function to see a movie list

export const getFavorites = async (req,res) => {

    try {
        const user = await clerkClient.users.getUser(req.auth().userId)
        const favorites = user.privateMetadata.favorites;

        //getting movies from database

        const movies = await Movie.find({_id : {$in : favorites}})

        res.json({success : true, movies})

    } catch (error) {
        console.log(error.message)
        res.json({success : false, message : error.message})
    }
}