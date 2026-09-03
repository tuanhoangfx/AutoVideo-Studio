import { handleGoogleDrivePublicRequest } from "../server-lib/google-drive-public-handler.mjs";

export function googleDriveDevApiPlugin() {
  return {
    name: "p0021-google-drive-dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/google-drive/public")) {
          next();
          return;
        }
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        try {
          const response = await handleGoogleDrivePublicRequest({
            url: `http://127.0.0.1${url}`,
            method: "GET",
          });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          const body = await response.arrayBuffer();
          res.end(Buffer.from(body));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              message: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
    },
  };
}
