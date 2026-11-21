
import http from "node:http";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const PORT = process.env.PORT || 5001;

wisp.options.allow_private_ips = false;
wisp.options.allow_loopback_ips = false;
wisp.options.stream_limit_total = 100;
wisp.options.stream_limit_per_host = 20;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });
    res.end(JSON.stringify({
      status: "online",
      service: "Project Rebellion Wisp"
    }));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain"
  });
  res.end("Project Rebellion Wisp Server");
});

server.on("upgrade", (request, socket, head) => {
  wisp.routeRequest(request, socket, head);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Wisp server listening on port ${PORT}`);
});
