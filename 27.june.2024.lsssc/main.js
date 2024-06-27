import http from "node:http";
import express from "express";
//import { WebSocketServer } from "ws";

const app = express();

app.use(express.static("client"));

const server = http.createServer(app);

const host = "localhost";
const port = 8000;

server.listen(port, host, () => {
  console.log(`server started on http://${host}: ${port}`);
});
