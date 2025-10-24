import stripe from 'stripe';
import Booking from '../models/Booking.js'

export const stripeWebHooks = async (req, res) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(req.body , sig, process.env.STRIPE_WEBHOOK_SECRET)
         console.log("✅ Webhook event received:", event.type);
    } catch (error) {
        console.error("Webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error : ${error.message}`)
    }

   


    try {
        switch(event.type)
        {
            case 'checkout.session.completed':
                {

                    const session = event.data.object;
                    const bookingId = session.metadata.bookingId;

                    await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                   paymentLink: '',
              });
              /*
                    const paymentIntent = event.data.object;
                    const sessionList = await stripeInstance.checkout.sessions.list({
                        payment_intent : paymentIntent.id
                    })

                    const session = sessionList.data[0];

                    //in metadata we will extract booking id

                    const { bookingId } = session.metadata;

                    await Booking.findByIdAndUpdate(bookingId, {
                        isPaid : true,
                        paymentLink : ''
                    })*/
                    console.log(' Booking marked as paid:', bookingId);
                    break
                }

                default : console.log('unhandled event type', event.type)
        }
        res.json({recieved : true})
    } catch (error) {
        console.log("Webhook processing error : ", error)
        res.status(500).send("Internal Server Error")
    }
}