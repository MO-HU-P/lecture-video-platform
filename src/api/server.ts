import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { promises as fs } from 'fs';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost'],  // フロントエンドのオリジンを許可
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
}));

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'videos');

app.use('/videos', express.static(UPLOAD_DIR));

async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
  }
}

const storage = multer.diskStorage({
  destination: async function (_req, _file, cb) {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Not a video file'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  }
});

const errorHandler: express.ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
};

app.post('/api/upload', (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const videoUrl = `/videos/${req.file.filename}`;
    console.log('File uploaded successfully:', videoUrl);
    res.json({ videoUrl });
  });
});

app.use(errorHandler);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit();
});
