import moongose from "mongoose";
import { DB_NAME } from "../constants.js";
 
const connectDB = async () => {
    try {
       const connectionInstance = await moongose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`/nMongoDB connected !! DB HOST: ${connectionInstance.connection.host} `);
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
       process.exit(1);
    }
};

export default connectDB;