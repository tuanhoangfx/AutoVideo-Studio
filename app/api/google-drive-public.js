import { handleGoogleDrivePublicGet } from "../server-lib/google-drive-public-handler.mjs";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `https://${host}`);
    const result = await handleGoogleDrivePublicGet(url);
    if (result.body instanceof ArrayBuffer) {
      res.status(result.status);
      for (const [key, value] of Object.entries(result.headers || {})) {
        res.setHeader(key, value);
      }
      res.send(Buffer.from(result.body));
      return;
    }
    res.status(result.status).set(result.headers || {}).send(result.body);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ message });
  }
}
