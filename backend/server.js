const express = require("express");
const session = require("express-session");

const app = express();

app.use(express.json());

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));

app.listen(3000, () => {
    console.log("Server started on port 3000");
});