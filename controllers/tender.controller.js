const cloudinary = require("../config/cloudinary");
const sharp = require("sharp");
const fs = require("fs");

// Handle image upload
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Resize image using Sharp
    const resizedImagePath = `uploads/resized-${Date.now()}.jpeg`;
    await sharp(req.file.path)
      .resize(500, 500) // Resize image to 500x500 pixels
      .jpeg({ quality: 80 }) // Optimize JPEG quality
      .toFile(resizedImagePath);

    // Upload resized image to Cloudinary
    const result = await cloudinary.uploader.upload(resizedImagePath, {
      folder: "image-uploads",
      use_filename: true,
      unique_filename: false,
    });

    // Delete the temporary resized image
    fs.unlinkSync(resizedImagePath);

    // Respond with the image URL
    res.status(200).json({
      message: "Image uploaded and resized successfully!",
      url: result.secure_url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload image" });
  }
};
