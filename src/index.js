// require('dotenv').config()
import "dotenv/config";

console.log("MONGO_URI =", process.env.MONGO_URI);

import connectDB from "../src/db/index.js";

connectDB();



// import express from "express";
// const app = express();
//  (async () => {
//     try {
//         await moongose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//         app.on("error", (error) => {
//             console.error("Error", error);
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     } catch (error) {
//         console.error("Error", error)
//         throw error;
//     }
//  })();