import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Same uploads root as server.js (backend/uploads) so static files are served correctly
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// Save a base64-encoded image to disk and return a public URL path.
export const saveBase64Image = async (dataUrl, subfolder = 'customer-pets') => {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return null;
  }

  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const extension = mimeType.split('/')[1] || 'png';

  const buffer = Buffer.from(base64Data, 'base64');

  const targetDir = path.join(UPLOADS_ROOT, subfolder);

  await fs.promises.mkdir(targetDir, { recursive: true });

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
  const filePath = path.join(targetDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  // Public path used by frontend (served from Express static middleware)
  const publicPath = `/uploads/${subfolder}/${fileName}`;
  return publicPath;
};

