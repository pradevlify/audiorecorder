const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Create connection to MySQL
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "audiodb",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database.");
});

// Create table if it doesn't exist
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS audio_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

connection.query(createTableQuery, (err, results) => {
  if (err) throw err;
  console.log("Table created or already exists.");
});

// Endpoint to upload audio
app.post("/upload", upload.single("audio"), (req, res) => {
  const filename = req.file.filename;

  const query = "INSERT INTO audio_files (filename) VALUES (?)";
  connection.query(query, [filename], (err, results) => {
    if (err) throw err;
    res.status(200).send("File uploaded and saved to database.");
  });
});

// Endpoint to serve audio files
app.get("/audio/:id", (req, res) => {
  const id = req.params.id;

  const query = "SELECT filename FROM audio_files WHERE id = ?";
  connection.query(query, [id], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      const filename = results[0].filename;
      const filePath = path.join(__dirname, "uploads", filename);
      res.sendFile(filePath);
    } else {
      res.status(404).send("File not found.");
    }
  });
});

// app.post("/statusCount", (req, res) => {
//   const { count, status } = req.body;
//   const query = "INSERT INTO response (count, status) VALUES (?, ?)";

//   connection.query(query, [count, status], (err, results) => {
//     if (err) {
//       console.error("Error inserting data into MySQL:", err.message);
//       return res.status(500).send("Internal Server Error");
//     }

//     res.status(201).json({
//       status: "success",
//       data: results,
//     });
//   });
// });

app.post("/statusCount", (req, res) => {
  const { count, status } = req.body;

  const query = "INSERT INTO response (count, status) VALUES (?, ?)";
  connection.query(query, [count, status], (err, results) => {
    if (err) {
      console.error("Error inserting data into MySQL:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.status(201).json({
      message: "Data inserted successfully",
      count: count,
      status: status,
    });
  });
});

app.get("/lastResponse", (req, res) => {
  const query = "SELECT * FROM response ORDER BY id DESC LIMIT 1";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from MySQL:", err);
      return res.status(500).send("Internal Server Error");
    }
    if (results.length === 0) {
      return res.status(404).send("No data found");
    }
    res.status(200).json(results[0]);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
