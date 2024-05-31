const express = require('express');
const multer = require('multer');
const { promises: fs } = require('fs');
const { pdf } = require('pdf-to-img');
const path = require('path');

// Set up storage for multer to save the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const app = express();
const port = 3000;

// Ensure the directory exists
const ensureDirExists = async (dir) => {
  try {
    await fs.access(dir);
  } catch (error) {
    await fs.mkdir(dir);
  }
};

app.post('/convert', upload.single('pdf'), async (req, res) => {
  try {
    await ensureDirExists('uploads');
    const pdfPath = req.file.path;
    const outputDir = 'output';
    await ensureDirExists(outputDir);

    const document = await pdf(pdfPath, { scale: 3 });
    let counter = 1;
    const imagePaths = [];

    for await (const image of document) {
      const imagePath = path.join(outputDir, `page${counter}.png`);
      await fs.writeFile(imagePath, image);
      imagePaths.push(imagePath);
      counter++;
    }

    res.status(200).json({
      message: 'PDF successfully converted to images',
      images: imagePaths
    });
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    res.status(500).json({ error: 'Failed to convert PDF to images' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
