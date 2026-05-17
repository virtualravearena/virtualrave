import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const chainId = process.env.GROVE_CHAIN_ID ?? "232";
const audioDir = path.resolve(
  process.env.GROVE_AUDIO_DIR ?? "Z:/sunshinevendetta2026/normalized",
);
const outputPath = path.resolve(
  process.env.GROVE_MANIFEST ?? "public/mixtape/grove-manifest.json",
);
const readyDir = path.resolve(
  process.env.GROVE_READY_DIR ?? "Z:/sunshinevendetta2026/normalized-grove",
);
const maxUploadBytes = Number(process.env.GROVE_MAX_BYTES ?? 99_000_000);
const transcodeBitrate = process.env.GROVE_TRANSCODE_BITRATE ?? "96k";
const force = process.argv.includes("--force");

function parseTitle(filename) {
  const stem = path.basename(filename, path.extname(filename));
  const match = stem.match(/^(\d{4})\s+-\s+(.+)$/);
  if (!match) return { year: null, title: stem };
  return { year: Number(match[1]), title: match[2] };
}

function ffprobe(filePath) {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ],
    { encoding: "utf8" },
  );

  if (result.status !== 0 || !result.stdout) return null;

  try {
    const data = JSON.parse(result.stdout);
    const audio = data.streams?.find((stream) => stream.codec_type === "audio");
    return {
      durationSeconds: data.format?.duration ? Number(data.format.duration) : null,
      bitRate: data.format?.bit_rate ? Number(data.format.bit_rate) : null,
      codec: audio?.codec_name ?? null,
      sampleRate: audio?.sample_rate ? Number(audio.sample_rate) : null,
      channels: audio?.channels ?? null,
      tags: data.format?.tags ?? {},
    };
  } catch {
    return null;
  }
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

function readManifest() {
  if (!existsSync(outputPath)) {
    return {
      chainId: Number(chainId),
      uploadedAt: null,
      sourceDir: audioDir,
      files: [],
    };
  }
  return JSON.parse(readFileSync(outputPath, "utf8"));
}

function writeManifest(manifest) {
  manifest.uploadedAt = new Date().toISOString();
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function uploadFile(filePath) {
  const response = await fetch(`https://api.grove.storage/?chain_id=${chainId}`, {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: createReadStream(filePath),
    duplex: "half",
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message = typeof body === "object" ? JSON.stringify(body) : text;
    throw new Error(`Grove upload failed (${response.status}): ${message}`);
  }

  return {
    httpStatus: response.status,
    ...body,
  };
}

function normalizeGroveResponse(response) {
  const resource = Array.isArray(response) ? response[0] : (response[0] ?? response);
  return {
    httpStatus: response.httpStatus,
    storageKey: resource?.storage_key ?? resource?.storageKey ?? null,
    gatewayUrl: resource?.gateway_url ?? resource?.gatewayUrl ?? null,
    uri: resource?.uri ?? null,
    statusUrl: resource?.status_url ?? resource?.statusUrl ?? null,
    raw: response,
  };
}

async function prepareUploadFile(filePath, name, info) {
  if (info.size <= maxUploadBytes) {
    return {
      uploadPath: filePath,
      uploadFilename: name,
      transcoded: false,
      transcodeReason: null,
      uploadSizeBytes: info.size,
      uploadSha256: await sha256(filePath),
    };
  }

  mkdirSync(readyDir, { recursive: true });
  const outputPath = path.join(readyDir, name);
  const shouldTranscode = force || !existsSync(outputPath) || (await stat(outputPath)).size > maxUploadBytes;

  if (shouldTranscode) {
    console.log(`  transcoding over-limit file to ${transcodeBitrate}: ${outputPath}`);
    const result = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        filePath,
        "-map_metadata",
        "0",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        transcodeBitrate,
        outputPath,
      ],
      { encoding: "utf8" },
    );

    if (result.status !== 0) {
      throw new Error(`ffmpeg failed for ${name}\n${result.stderr}`);
    }
  }

  const uploadInfo = await stat(outputPath);
  if (uploadInfo.size > maxUploadBytes) {
    throw new Error(`${name} is still too large after transcoding: ${uploadInfo.size} bytes`);
  }

  return {
    uploadPath: outputPath,
    uploadFilename: name,
    transcoded: true,
    transcodeReason: `Original file exceeded ${maxUploadBytes} bytes Grove gateway limit`,
    uploadSizeBytes: uploadInfo.size,
    uploadSha256: await sha256(outputPath),
  };
}

async function main() {
  const manifest = readManifest();
  manifest.chainId = Number(chainId);
  manifest.sourceDir = audioDir;

  const names = (await readdir(audioDir))
    .filter((name) => name.toLowerCase().endsWith(".mp3"))
    .sort((a, b) => a.localeCompare(b));

  for (const [index, name] of names.entries()) {
    const existing = manifest.files.find((file) => file.filename === name && file.uri);
    if (existing && !force) {
      console.log(`[skip] ${name} -> ${existing.uri}`);
      continue;
    }

    const filePath = path.join(audioDir, name);
    const info = await stat(filePath);
    const parsed = parseTitle(name);

    console.log(`[${index + 1}/${names.length}] hashing source ${name}`);
    const localSha256 = await sha256(filePath);

    console.log(`[${index + 1}/${names.length}] probing ${name}`);
    const media = ffprobe(filePath);

    console.log(`[${index + 1}/${names.length}] preparing ${name}`);
    const prepared = await prepareUploadFile(filePath, name, info);

    console.log(`[${index + 1}/${names.length}] uploading ${prepared.uploadFilename}`);
    const grove = normalizeGroveResponse(await uploadFile(prepared.uploadPath));

    const entry = {
      id: String(index + 1).padStart(2, "0"),
      filename: name,
      ...parsed,
      mimeType: "audio/mpeg",
      sizeBytes: info.size,
      localSha256,
      uploadFilename: prepared.uploadFilename,
      uploadSizeBytes: prepared.uploadSizeBytes,
      uploadSha256: prepared.uploadSha256,
      transcoded: prepared.transcoded,
      transcodeReason: prepared.transcodeReason,
      transcodeBitrate: prepared.transcoded ? transcodeBitrate : null,
      media,
      storageKey: grove.storageKey,
      gatewayUrl: grove.gatewayUrl,
      uri: grove.uri,
      statusUrl: grove.statusUrl,
      httpStatus: grove.httpStatus,
    };

    const currentIndex = manifest.files.findIndex((file) => file.filename === name);
    if (currentIndex >= 0) {
      manifest.files[currentIndex] = entry;
    } else {
      manifest.files.push(entry);
    }
    manifest.files.sort((a, b) => a.filename.localeCompare(b.filename));
    writeManifest(manifest);
    console.log(`[done] ${name} -> ${entry.uri}`);
  }

  writeManifest(manifest);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
