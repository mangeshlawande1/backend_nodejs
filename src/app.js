import express from 'express'
import cors from "cors"


const app = express()

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb " }))
app.use(express.static("public"));

// cors configurations--> allowed communication 
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ["Authorization", "Content-Type"]
    }
))


app.get('/', (req, res) => {
    res.status(200).send("processes is running ...")
});


export default app;
