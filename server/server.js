import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDb from './configs/db.js';
//so that we can use environment variable
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoute.js';
import adminRouter from './routes/adminRoute.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebHooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = 3000;


await connectDb();

//stripe webhooks route
app.post('/api/webhook/stripe', express.raw({ type : 'application/json'}), stripeWebHooks)

//Middleware
app.use(cors());  
app.use(express.json());
app.use(clerkMiddleware())



//api routes
app.get('/', (req,res) => res.send("Server is live"))
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)


app.listen(port, () =>console.log(`Server listening at http://localhost:${port}`))