import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const CreateNewUser = mutation({
    args:{
        name:v.string(),
        email:v.string(),
    },
    handler:async(ctx,args)=>{
        // if user already exist
        const user = await ctx.db.query('UserTable')
        .filter((q)=>q.eq(q.field('email'), args.email))
        .collect()
        // If Not, then create new user
        if (user?.length==0){
            const userData={
                name: args.name,
                email:args?.email,
                token:5000
            }
            const userId = await ctx.db.insert('UserTable',userData)
            return await ctx.db.get(userId);
        }
        return user[0];
    }
})
