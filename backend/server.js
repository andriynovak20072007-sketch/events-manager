const express = require("express");
const session = require("express-session");
const cors = require("cors");

const app = express();

// middleware
app.use(express.json());
app.use(cors());

app.use(
    session({
        secret: "secretkey",
        resave: false,
        saveUninitialized: true
    })
);

// тестовий маршрут
app.get("/", (req, res) => {
    res.send("Server is running");
});

// порт
const PORT = process.env.PORT || 3000;

// запуск сервера
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});