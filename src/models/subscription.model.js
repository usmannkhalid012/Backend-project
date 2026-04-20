import mongoose,{Schema} from "mongoose";
import { refreshAccessToken } from "../controllers/user.controller";
const subscriptionSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User"},
        channel:{
            type:Schema.Types.ObjectId,
            ref:"Channel"
        }
        },{timestamps:true})
  export const Subscription = mongoose.model("Subscription",subscriptionSchema)