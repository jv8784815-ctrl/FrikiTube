import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Utilidad interna ────────────────────────────────────────────────────────

async function fetchFromSylphy(url, type, quality) {
  const endpoint =
    type === "audio"
      ? "https://ytdl.sylphy.xyz/api/download/mp3"
      : "https://ytdl.sylphy.xyz/api/download/mp4";

  const { data } = await axios.post(
    endpoint,
    { url, quality, mode: "url" },
    { headers: { "content-type": "application/json" } }
  );

  return {
    title: data.title,
    author: data.author,
    duration: data.duration,
    type: data.type,
    format: data.format,
    quality: data.quality,
    thumbnail: data.thumbnail,
    filesize: data.filesize,
    dl: data.dl_url,
  };
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * POST /api/ytmp3
 * Body: { url: string, quality?: "128k"|"192k"|"256k"|"320k" }
 */
app.post("/api/ytmp3", async (req, res) => {
  const { url, quality = "320k" } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Se requiere el campo 'url'" });
  }

  const validQualities = ["128k", "192k", "256k", "320k"];
  if (!validQualities.includes(quality)) {
    return res.status(400).json({
      error: `Calidad inválida. Usa: ${validQualities.join(", ")}`,
    });
  }

  try {
    const result = await fetchFromSylphy(url, "audio", quality);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({
      error: "Error al procesar el audio",
      details: err.response?.data || err.message,
    });
  }
});

/**
 * POST /api/ytmp4
 * Body: { url: string, quality?: "360p"|"480p"|"720p"|"1080p" }
 */
app.post("/api/ytmp4", async (req, res) => {
  const { url, quality = "720p" } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Se requiere el campo 'url'" });
  }

  const validQualities = ["360p", "480p", "720p", "1080p"];
  if (!validQualities.includes(quality)) {
    return res.status(400).json({
      error: `Calidad inválida. Usa: ${validQualities.join(", ")}`,
    });
  }

  try {
    const result = await fetchFromSylphy(url, "video", quality);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({
      error: "Error al procesar el video",
      details: err.response?.data || err.message,
    });
  }
});

/**
 * GET /ping — Health check para Render y para el botón Test
 */
app.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "FrikiTube API is alive 🎵" });
});

// ─── Root ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    name: "FrikiTube API",
    version: "1.0.0",
    endpoints: [
      { method: "POST", path: "/api/ytmp3", desc: "Descargar audio MP3" },
      { method: "POST", path: "/api/ytmp4", desc: "Descargar video MP4" },
      { method: "GET",  path: "/ping",      desc: "Health check" },
    ],
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎵 FrikiTube API corriendo en puerto ${PORT}`);
});
