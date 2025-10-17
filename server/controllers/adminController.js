//Api to check user is admin or not


import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";

/*
export const isAdmin = async (req,res) => {
    res.json({succcess : true, isAdmin : true})
}*/

import { clerkClient } from "@clerk/express";

export const isAdmin = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await clerkClient.users.getUser(userId);

    const isAdmin = user.privateMetadata.role === "admin";

    res.json({ success: true, isAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to check admin status" });
  }
};

//api to get dashboard data

export const getDashBoardData = async (req,res) => {
    try {
        const bookings = await Booking.find({isPaid : true});
        const activeShows = await Show.find({}).populate('movie');

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings : bookings.length,
            totalRevenue : bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUser
        }

        res.json({succcess : true, dashboardData})
    } catch (error) {
        console.log(error.message)
        res.json({succcess : false, message : error.message })
    }
}

//api to get all shows

export const getAllShows = async (req,res) => {
    try {
        const shows = await Show.find({}).populate('movie').sort({showDateTime : 1})
        res.json({succcess : true, shows})

    } catch (error) {
        console.log(error.message)
        res.json({succcess : false, message : error.message })
    }
}

//api to get all Bookings

export const getAllBookings = async (req,res) => {

    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path : "show",
            populate : {path : "movie"}
        }).sort({createdAt : -1})

        res.json({succcess : true, bookings})
    } catch (error) {
        console.log(error.message)
        res.json({succcess : false, message : error.message })
    }
}