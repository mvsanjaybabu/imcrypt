const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const algorithm = 'aes-256-cbc';

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle image upload and encryption
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { path: inputPath, originalname: filename } = req.file;
    const encryptedImagePath = path.join('uploads', `${filename}.enc`);
    const key = crypto.randomBytes(32); // Generate a new key for each encryption
    const iv = crypto.randomBytes(16); // Generate a new IV for each encryption
    await encryptImage(inputPath, encryptedImagePath, key, iv);
    console.log('File encrypted:', encryptedImagePath);
    const encryptionKey = key.toString('hex');
    const ivHex = iv.toString('hex');
    res.json({ encryptedImagePath: `uploads/${filename}.enc`, encryptionKey, iv: ivHex, message: 'File encrypted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to encrypt file' });
  }
});

// Handle image decryption
app.post('/decrypt', async (req, res) => {
  try {
    const { encryptedImagePath, key, iv } = req.body;
    console.log('Decrypting file:', encryptedImagePath);
    const filename = path.basename(encryptedImagePath, path.extname(encryptedImagePath));
    const decryptedImagePath = path.join('uploads', `${filename}-decrypted.jpg`);
    await decryptImage(encryptedImagePath, decryptedImagePath, key, iv);
    console.log('File decrypted:', decryptedImagePath);
    res.json({ decryptedImagePath: `uploads/${filename}-decrypted.jpg`, message: 'File decrypted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to decrypt file' });
  }
});

// Encrypt a file
async function encryptImage(inputPath, outputPath, key, iv) {
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    cipher.on('error', reject);
  });
}

// Decrypt a file
async function decryptImage(encryptedImagePath, decryptedImagePath, keyHex, ivHex) {
  const input = fs.createReadStream(encryptedImagePath);
  const output = fs.createWriteStream(decryptedImagePath);

  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  input.pipe(decipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    decipher.on('error', reject);
    input.on('error', reject);
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
