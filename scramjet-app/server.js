import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createRequire } from "node:module";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.join(__dirname, "public");

const PORT = Number(process.env.PORT) || 8080;

const app = express();

/* RESPONSE HEADERS */

app.use((_req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});

/* PACKAGE PATHS */

const require = createRequire(import.meta.url);

const dirOf = (specifier) =>
    path.dirname(require.resolve(specifier));

/* SCRAMJET FILES */

app.use("/scram/", express.static(scramjetPath));

app.use(
    "/utils/",
    express.static(dirOf("@mercuryworkshop/scramjet-utils"))
);

app.use(
    "/controller/",
    express.static(dirOf("@mercuryworkshop/scramjet-controller"))
);

app.use(
    "/libcurl/",
    express.static(dirOf("@mercuryworkshop/libcurl-transport"))
);

/* WEBSITE FILES */

app.use(express.static(staticRoot, {
    setHeaders(res, filePath) {
        if (path.basename(filePath).endsWith("sw.js")) {
            res.setHeader("Cache-Control", "no-cache");
        }
    }
}));

/* HEALTH CHECK */

app.get("/health", (_req, res) => {
    res.json({
        status: "online",
        service: "Project Rebellion Scramjet"
    });
});

/* HTTP SERVER */

const server = http.createServer(app);

/* WISP WEBSOCKET */

server.on("upgrade", (req, socket, head) => {
    const wispPath = new URL(
        req.url ?? "/",
        "http://localhost"
    ).pathname;

    if (wispPath === "/wisp/") {
        req.url = wispPath;
        wisp.routeRequest(req, socket, head);
        return;
    }

    socket.end();
});

/* RENDER PORT LISTENER */

const listenWithFallback = (
    target,
    startPort,
    attempts = 20
) => {
    let port = startPort;
    let left = attempts;

    const onError = (error) => {
        if (error.code !== "EADDRINUSE" || left-- <= 0) {
            console.error(
                `Could not listen on port ${port}: ${error.message}`
            );
            process.exit(1);
        }

        console.warn(
            `Port ${port} is in use, trying ${port + 1}...`
        );

        port += 1;
        target.listen(port, "0.0.0.0");
    };

    target.on("error", onError);

    target.listen(port, "0.0.0.0", () => {
        target.off("error", onError);

        console.log(
            `Project Rebellion Scramjet listening on 0.0.0.0:${port}`
        );
    });
};

listenWithFallback(server, PORT);

/* CLEAN SHUTDOWN */

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
        server.close(() => process.exit(0));
    });
}
