//we will create a funtion that will protect our admin route

//we will import clerk client

import { clerkClient } from "@clerk/express";

//next will call the next method

export const protectAdmin = async (req, res, next) => {
    try {

        //calls the function req.auth()
        //Whatever object it returns, extract the property named userId from it.
        
        const { userId } = req.auth();

        //it will verify user
        const user = await clerkClient.users.getUser(userId)

        if(user.privateMetadata.role  !== 'admin')
        {
            return res.json({success : false, message: "not authorized"})
        }

        next();

    } catch (error) {
        return res.json({ success:false, message: "not authorized"})
    }
}