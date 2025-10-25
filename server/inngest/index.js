import { Inngest } from "inngest";
import User from "../models/User.js";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" })

//Inngest function to save user data to a database

const syncUserCreation = inngest.createFunction(
    {id : 'sync-user-from-clerk'},
    {event : 'clerk/user.created'},
    async ({event}) => {
        //getting data from event
        const {id, first_name, last_name, email_addresses, image_url} = event.data;
        const userData = {
            _id : id,
            email : email_addresses[0].email_address,
            name : first_name + " " + last_name,
            image : image_url
        }
        await User.create(userData)
    }
)


//inngest function to delete user from database

const syncUserDeletion = inngest.createFunction(
    {id : 'delete-user-with-clerk'},
    {event : 'clerk/user.deleted'},
    async({event}) => {

        const {id} = event.data;
        await User.findByIdAndDelete(id);
    }
)


//inngest function to update user in database

const syncUserUpdation = inngest.createFunction(

    {id : 'update-user-from-clerk'},
    {event : 'clerk/user.updated'},

    async({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data;
        const userData = {
            _id : id,
            email  : email_addresses[0].email_address,
            name : first_name + " " + last_name,
            image : image_url
        }

        await User.findByIdAndUpdate(id, userData)
    }
)

//inngest function to cancel booking and release seats of show after 10 minutes of booking created if payment is not made

const releaseSeatsAndDeleteBookings = inngest.createFunction(
    {id : 'release-seats-delete-booking'},
    { event : 'app/checkpayment'},
    async ({event, step}) => {
        const tenMinuteLater = new Date(Date.now() + 10 * 60 * 1000)
        await step.sleepUntil('wait-for-10-minutes',tenMinuteLater)

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId;

            //using bookingId we will find booking data from db
            const booking = await Booking.findById(bookingId)

            //if payment is not made, release seats and delete booking
            if(!booking.isPaid)
            {
                const show = await Show.findById(booking.show)
                //from this show we have to release the seats
                booking.bookedSeats.forEach((seat) => {
                     delete show.occupiedSeats[seat];
                })
                show.markModified('occupiedSeats')
                await show.save();
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)

//inngest function to send email when user books a show


const sendBookingConfirmationEmail = inngest.createFunction(
    {id : 'send-booking-confirmation-email'},
    { event : 'app/show.booked'},
    async ({event, step}) => {
        const {bookingId} = event.data;

        //to send confirmation email first we will create booking data
         const booking = await Booking.findById(bookingId).populate({
            path : 'show',
            populate : {path : "movie", model : 'Movie'}
         }).populate('user')

         //we will send this data in email we need package called nodemailer

         await sendEmail({
            to : booking.user.email,
            subject : `Payment Confirmation : ${booking.show.movie.title} booked!`,
            body : `
            <h1> Hi ${booking.user.name}</h1>
            <p>Your booking for ${booking.show.movie.title} <strong> is confirmed </strong> </p>
            <p>
            <strong>Date :</strong> ${new Date(booking.show.showDateTime).toLocaleDateString(`en-US`, {timeZone : 'Asia/Kolkata'})} <br />
            <strong>Time : </strong> ${new Date(booking.show.showDateTime).toLocaleTimeString(`en-US`, {timeZone : 'Asia/Kolkata'})}
            </p>
            <p>Enjoy the show</p>
            <p>Thanks for booking with us! <br/> BookMeShow Team</p>
            `
         })
    }

    
   
)

//inngest function to send reminder email to user before showtime

const sendShowReminders = inngest.createFunction(
    {id : 'send-show-reminders'},
    {cron : '0 */8 * * *'}, //it will execute every 8 hours

    async ({step})   => {
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000)
        const windowStart = new Date(in8Hours.getTime() - 10 * 30 * 1000)

        //prepare reminder tasks
        const reminderTasks = await step.run('prepare-reminder-tasks', async () => {
            const shows = await Show.find({
                showDateTime : {$gte : windowStart, $lte : in8Hours}
            }).populate('movie')

            const tasks = [];

            for(const show of shows){
                if(!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new set(Object.values(show.occupiedSeats))]

                if(userIds.length === 0) continue;

                const users = await User.find({_id : {$in : userIds}}).select("name email");

                for(const user of users)
                {
                    tasks.push({
                        userEmail : user.email,
                        userName  :user.name,
                        movieTitle : show.movie.title,
                        showTime : show.showTime
                    })
                }

            }
            return tasks;
        })

        if(reminderTasks.length === 0 ) {
            return {sent : 0, message : "No reminders to send"}
        }
        //send reminders emails

        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail({
                    to : task.userEmail,
                    subject : `Reminder : your movie ${task.movieTitle} starts soon`,
                    body : `
                    <h2>Hello ${task.userName}</h2>
                    <p>This is a quick reminder that your movie : </p>
                    <h3>${task.movieTitle}</h3>
                    <p>
                    is sheduled for <strong> ${new Date(task.showTime).toLocaleDateString('en-Us', {timeZone : 'Asia/Kolkata'})}</strong> at <strong> ${new Date(task.showTime).toLocaleTimeString('en-US', {timeZone : 'Asia/Kolkata'})} </strong>
                    </p>
                    <p>It starts in approximately 8 hours make you are ready</p> </br>
                    <p>Enjoy the show! <br/> BookMeShow Team </p>
                    `
                }))
            )
        })

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - sent;

        return {sent, failed, message : `Sent ${sent} reminders(s), ${failed} failed`}
    }
)

//function that will send email to admin whenever he adds any show

const sendNewShowNotifications = inngest.createFunction(
    {id : 'send-new-show-notification'},
    {event : 'app/show.added'},
    async ({event}) => {
        const {movieTitle} = event.data;

        const users = await User.find({});

        for(const user of users)
        {
            const userEmail = user.email;
            const userName = user.name;

            const subject = `New Show Added : ${movieTitle}`;
            const body = `
            <h1>Hi ${userName}</h1>
            <p>We have added a new show to our library : </p>
            <h3>${movieTitle}</h3>
            <p>Visit our Websites</p>
            <br />
            <p>Thanks <br /> BookMeShow Team!</p>
            `

            await sendEmail({
            to : userEmail,
            subject,
            body,
        })
        }

        return {message : "Notification sent."}
   
    }
)


// Create an empty array where we'll export future Inngest functions
export const functions = [sendNewShowNotifications,sendShowReminders,syncUserCreation,syncUserDeletion, syncUserUpdation, releaseSeatsAndDeleteBookings,sendBookingConfirmationEmail ];