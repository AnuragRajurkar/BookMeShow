

//Function to check availability  of seleted seats for a movie

import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js"
import stripe from 'stripe'

const checkSeatsAvailability = async (showId, selectedSeats) => {

    try {
       const showData =  await Show.findById(showId)
       if(!showData) return false;

       const occupiedSeats = showData.occupiedSeats;

       //checking seats is available or not
       const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);


       return !isAnySeatTaken;
       //it will return either true or false
        
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

//create booking function


export const createBooking = async (req,res) => {

    try {
        const {userId} = req.auth()
        const {showId, selectedSeats} = req.body
        const {origin} = req.headers;

        //check if the seats is available for seleted show

        const isAvailable = await checkSeatsAvailability(showId,selectedSeats)

        if(!isAvailable)
        {
            return res.json({success : false, message : "Seleted seats are not available"})
        }

        //suppose seat is available we will get show details

        const showData = await Show.findById(showId).populate('movie')

        //create a new booking

        const booking = await Booking.create({
            user : userId,
            show : showId,
            amount : showData.showPrice * selectedSeats.length,
            bookedSeats : selectedSeats
        })

        //now we have to reserved a seat in show data

        selectedSeats.map((seat) => {
            showData.occupiedSeats[seat] = userId
        })

        showData.markModified('occupiedSeats')

        await showData.save();

        //after saving data in mongodb databsase we will initialize stripe payment gateway user will redirected to payment link 
        //stripe gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        //creating line items for stripe
        const line_items = [{
            price_data : {
                currency : 'aud',
                product_data : {
                    name : showData.movie.title
                },
                unit_amount : Math.floor(booking.amount) * 100
            },
            quantity : 1
        }]

        //using line item we will create session

        const session = await stripeInstance.checkout.sessions.create({
            success_url : `${origin}/loading/my-bookings`,
            cancel_url : `${origin}/my-bookings`,
            line_items : line_items,
            mode : 'payment',
            metadata : {
                bookingId : booking._id.toString()
            },
            expires_at : Math.floor(Date.now() / 1000) + 30 * 60 //expires in 30 minutes
        })

        booking.paymentLink = session.url;
        await booking.save();

        //run inngest scheduler function to check payment status after 10 minutes
        await inngest.send({
            name : 'app/checkpayment',
            data : {
                bookingId : booking._id.toString()
            }
        })

        res.json({success : true, url:session.url })

    } catch (error) {
        console.log(error.message)
        res.json({success:  false, message : error.message})
    }
}

export const getOccupiedSeats = async (req,res) => {

    try {

        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)
        res.json({success:  true, occupiedSeats})
    } catch (error) {
        console.log(error.message)
        res.json({success:  false, message : error.message})
    }
}