import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDb from './configs/db.js';
//so that we can use environment variable
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

const app = express();
const port = 3000;


await connectDb();

//Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())



//api routes
app.get('/', (req,res) => res.send("Server is live"))
app.use("/api/inngest", serve({ client: inngest, functions }));


app.listen(port, () =>console.log(`Server listening at http://localhost:${port}`))