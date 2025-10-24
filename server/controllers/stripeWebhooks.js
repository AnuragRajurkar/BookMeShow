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
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error : ${error.message}`)
    }

     // ✅ Handle successful payment
  if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
    const session = event.data.object;
    console.log("✅ Session object:", session);

    // Make sure you pass bookingId as metadata when creating the session
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      console.error("❌ No bookingId found in metadata");
      return res.status(200).json({ received: true });
    }

    // Update booking
    try {
      await Booking.findByIdAndUpdate(bookingId, { isPaid: true });
      console.log(`✅ Booking ${bookingId} marked as paid`);
    } catch (err) {
      console.error("❌ Failed to update booking:", err);
    }
  }

  res.status(200).json({ received: true });
};

/*

    try {
        switch(event.type)
        {
            case 'checkout.session.completed':
                {
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
                    })
                    break
                }

                default : console.log('unhandled event type', event.type)
        }
        res.json({recieved : true})
    } catch (error) {
        console.log("Webhook processing error : ", error)
        res.status(500).send("Internal Server Error")
    }
}*/