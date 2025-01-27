const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Temporary storage
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// API Endpoint for image upload
app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).send({ message: "No file uploaded" });
    }

    console.log("File received:", req.file);

    // Optional: Resize the image (if you're doing this)
    const resizedPath = path.join(uploadsDir, `resized-${req.file.filename}`);
    console.log("Resizing file...");

    await sharp(req.file.path).resize(800, 800).toFile(resizedPath);
    console.log("Image resized");

    const result = await cloudinary.uploader.upload(resizedPath, {
      folder: "uploads",
    });
    console.log("Cloudinary result:", result);

    // Clean up temporary files
    fs.unlinkSync(req.file.path);
    fs.unlinkSync(resizedPath);

    res.status(200).send({
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Error during upload:", error); // Add detailed logging
    res
      .status(500)
      .send({ message: "Image upload failed", error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
