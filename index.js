const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Statische Dateien aus dem Ordner "docs" bereitstellen
app.use(express.static(path.join(__dirname, "public")));

// Explizite Route für die Startseite
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
    console.log(`Server läuft unter http://localhost:${port}`);
});
