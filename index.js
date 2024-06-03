import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { seleniumPipeline } from "./twitter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDirectoryPath = path.join(__dirname, "public");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, "index.html"));
});

app.get("/run-selenium-script", async (req, res) => {
  const result = await seleniumPipeline();
  res.send(result);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
