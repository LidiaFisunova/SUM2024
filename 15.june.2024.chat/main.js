import http from "node:http";
import fs from "node:fs/promises";
import process from "node:process";
import express from "express";

const requestListener = async (req, res) => {
  if (req.url == "/") {
    const contests = await fs.readFile(process.cwd() + "/client/index.html");
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(contests);
  } else {
    if (req.url.endsWith(".js")) {
      const contests = await fs.readFile(process.cwd() + "/client/index.js");
      res.setHeader("Content-Type", "text/javascript");
      res.writeHead(200);
      res.end(contests);
    }
  }
};

const app = express();
app.use(express.static("client"));

const server = http.createServer(requestListener);

const host = "localhost";
const port = 8000;

server.listen(port, host, () => {
  console.log(`server started on http://${host}: ${port}`);
});
