// require('dotenv').config()
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import {app} from './app.js';
import connectDB from "./db/index.js";

connectDB()
.then(() => {
 app.listen(8000, () => {
  console.log("Server running on port 8000");
});
})
.catch((error) => {
    console.error("MONGO db conection Failed", error);
  
})
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