const multer = require("multer");
const path = require("path");

// simpan file ke folder "uploads/"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // folder uploads di root project
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// export siap pakai
const upload = multer({ storage });

module.exports = upload;
