/**
 * Google Drive public folder API — shared by Vite dev middleware and Vercel serverless.
 */
const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

function driveParams(params) {
  const key =
    process.env.GOOGLE_DRIVE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.VITE_GOOGLE_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_DRIVE_API_KEY on the server.");
  return new URLSearchParams({ ...params, key });
}

function isDriveId(value) {
  return /^[a-zA-Z0-9_-]{20,}$/.test(value);
}

function parseDriveFolderId(input) {
  const value = String(input || "").trim();
  if (!value) return null;
  if (isDriveId(value)) return value;
  try {
    const url = new URL(value);
    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return folderMatch[1];
    return url.searchParams.get("id") || url.searchParams.get("folders");
  } catch {
    return null;
  }
}

function safeFileName(name) {
  return String(name).replace(/["\r\n]/g, "_");
}

async function driveErrorMessage(res, fallback) {
  let detail = "";
  try {
    const data = await res.json();
    detail = data?.error?.message ? ` ${data.error.message}` : "";
  } catch {
    try {
      detail = ` ${await res.text()}`;
    } catch {
      /* ignore */
    }
  }
  if (detail.includes("referer") || detail.includes("API key")) {
    return `${fallback} API key is blocked by restrictions. Check GOOGLE_DRIVE_API_REFERER or the referrer allowlist in Google Cloud.${detail}`;
  }
  if (res.status === 403 || res.status === 404) {
    return `${fallback} Make sure the folder/file is public ("Anyone with the link can view") and Google Drive API is enabled.${detail}`;
  }
  return `${fallback} (${res.status})${detail}`;
}

function driveFetch(url) {
  return fetch(url, {
    cache: "no-store",
    headers: {
      Referer: process.env.GOOGLE_DRIVE_API_REFERER || "http://localhost:3021/studio",
    },
  });
}

async function driveJson(url, fallback) {
  const res = await driveFetch(url);
  if (!res.ok) throw new Error(await driveErrorMessage(res, fallback));
  return res.json();
}

async function getPublicDriveFolder(folderInput) {
  const id = parseDriveFolderId(folderInput);
  if (!id) throw new Error("Invalid Google Drive folder link or ID.");
  const data = await driveJson(
    `${DRIVE_API}/${encodeURIComponent(id)}?${driveParams({
      fields: "id,name,mimeType",
      supportsAllDrives: "true",
    })}`,
    "Could not read the public folder.",
  );
  if (data.mimeType && data.mimeType !== DRIVE_FOLDER_MIME) {
    throw new Error("This Google Drive link is not a folder.");
  }
  return { id: data.id || id, name: data.name || id };
}

async function listDriveFolderChildren(folderId) {
  const files = [];
  let pageToken;
  do {
    const params = driveParams({
      q: `'${folderId}' in parents and trashed = false and (mimeType = '${DRIVE_FOLDER_MIME}' or mimeType contains 'image/')`,
      fields: "nextPageToken,files(id,name,mimeType,thumbnailLink,size,modifiedTime)",
      orderBy: "name_natural",
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await driveJson(`${DRIVE_API}?${params}`, "Could not list images in the public folder.");
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return files;
}

async function listDriveFolderImages(folderId) {
  const files = [];
  const queue = [{ id: folderId, path: "" }];
  while (queue.length > 0) {
    const current = queue.shift();
    const children = await listDriveFolderChildren(current.id);
    for (const child of children) {
      const relativePath = current.path ? `${current.path}/${child.name}` : child.name;
      if (child.mimeType === DRIVE_FOLDER_MIME) {
        queue.push({ id: child.id, path: relativePath });
      } else if (child.mimeType?.startsWith("image/")) {
        files.push({
          ...child,
          relativePath: current.path ? relativePath : `Images/${child.name}`,
        });
      }
    }
  }
  return files;
}

async function downloadDriveImage(fileId, fileName, mimeType) {
  const res = await driveFetch(`${DRIVE_API}/${encodeURIComponent(fileId)}?${driveParams({ alt: "media" })}`);
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      body: { message: await driveErrorMessage(res, `Could not download image ${fileName}.`) },
    };
  }
  const buffer = await res.arrayBuffer();
  return {
    ok: true,
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") || mimeType || "image/jpeg",
      "cache-control": "private, max-age=86400",
      "content-disposition": `inline; filename="${safeFileName(fileName)}"`,
    },
    body: buffer,
  };
}

function jsonResponse(body, status = 200) {
  return {
    ok: true,
    status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function errorResponse(message, status = 500) {
  return jsonResponse({ message }, status);
}

/**
 * @param {URL} url
 */
export async function handleGoogleDrivePublicGet(url) {
  const mode = url.searchParams.get("mode");

  if (mode === "folder") {
    const input = url.searchParams.get("input") ?? "";
    const folder = await getPublicDriveFolder(input);
    return jsonResponse(folder);
  }

  if (mode === "list") {
    const folderId = url.searchParams.get("folderId") ?? "";
    if (!isDriveId(folderId)) return errorResponse("Invalid Google Drive folder ID.", 400);
    const files = await listDriveFolderImages(folderId);
    return jsonResponse({ files });
  }

  if (mode === "download") {
    const fileId = url.searchParams.get("fileId") ?? "";
    const fileName = url.searchParams.get("name") ?? "drive-image";
    const mimeType = url.searchParams.get("mimeType") ?? "image/jpeg";
    if (!isDriveId(fileId)) return errorResponse("Invalid Google Drive file ID.", 400);
    return downloadDriveImage(fileId, fileName, mimeType);
  }

  return errorResponse("Invalid Drive mode.", 400);
}

export async function handleGoogleDrivePublicRequest(req) {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const result = await handleGoogleDrivePublicGet(url);
    if (result.ok === false) {
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { "content-type": "application/json" },
      });
    }
    if (result.body instanceof ArrayBuffer) {
      return new Response(result.body, { status: result.status, headers: result.headers });
    }
    return new Response(result.body, { status: result.status, headers: result.headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
