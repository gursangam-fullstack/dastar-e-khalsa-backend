const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
require('./config/Db')
const AuthRouter = require('./Router/AuthRouter')
const port = 3001;

// main app 
app.use(bodyParser.json());

const allowedOrigins = [
    "https://dastar-e-khalsa.vercel.app",
    "http://localhost:5173",
    "https://ap-dek.vercel.app"
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);
app.use('/', AuthRouter)

app.listen(port, () => {
    console.log(`server listern on port: ${port}`);

})
