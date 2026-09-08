import type { VercelRequest, VercelResponse } from "@vercel/node";
import sharp from "sharp";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const score = Number(req.query.score || 0);
  const max = Number(req.query.max || 145);
  const label = String(req.query.label || "");
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 145;
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, safeScore / safeMax));
  const escapedLabel = label.replace(/[&<>\"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);

  const svg = `<svg width="360" height="360" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="360" fill="#211e2d"/>
    <circle cx="180" cy="145" r="${radius}" fill="none" stroke="#2a2733" stroke-width="24"/>
    <circle cx="180" cy="145" r="${radius}" fill="none" stroke="#f6c66a" stroke-width="24" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 180 145)"/>
    <text x="180" y="139" text-anchor="middle" fill="#f6c66a" font-family="Arial,sans-serif" font-size="64" font-weight="800">${safeScore}</text>
    <text x="180" y="167" text-anchor="middle" fill="#777184" font-family="Arial,sans-serif" font-size="18">/ ${safeMax}</text>
    ${escapedLabel ? `<rect x="58" y="282" width="244" height="42" rx="21" fill="#f6c66a33"/><text x="180" y="309" text-anchor="middle" fill="#f6c66a" font-family="Arial,sans-serif" font-size="17" font-weight="700">${escapedLabel}</text>` : ""}
  </svg>`;

  try {
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(png);
  } catch (error) {
    console.error("Erro ao gerar score-ring:", error);
    res.status(500).json({ error: "Não foi possível gerar o score." });
  }
}
