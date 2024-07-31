const sharp = require("sharp");
const path = require("path");

module.exports = (req, res, next) => {
  if (req.file) {
    const fileName = req.file.originalname.split(" ").join("_").replace(path.extname(req.file.originalname), "");
    const outputFileName = `${fileName}_${Date.now()}.webp`;
    const outputPath = path.join(__dirname, "..", "images", outputFileName);

    sharp(req.file.buffer)
      .resize(206, 260, { fit: "cover" })
      .toFile(outputPath, (error) => {
        if (error) {
          return res.status(500).json({ error: "Erreur lors de l'optimisation de l'image." });
        }
        req.file.filename = outputFileName;
        req.file.path = outputPath;
        next();
      });
  } else {
    next();
  }
};