import http from "node:http";
import fs from "node:fs/promises";
import process from "node:process";
import express from "express";
import { WebSocketServer } from "ws";

/*
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
*/

const app = express();

app.get("/", (req, res, next) => {
  counter = counter + 1;
  next();
})

app.get("/getData", (req, res, next) => {
  res.send(`new message mfimfowld send pls: ${counter}`);
})

app.use(express.static("client"));

let counter = 0;

const server = http.createServer(app);

const wss = new WebSocketServer({server});
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(message.toString());
    ws.send(`new message: ${message}`);
  });

  ws.send("new client connected");
});

const host = "localhost";
const port = 8000;

server.listen(port, host, () => {
  console.log(`server started on http://${host}: ${port}`);
});