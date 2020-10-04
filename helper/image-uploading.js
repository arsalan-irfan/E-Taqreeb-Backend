const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const fs = require("fs");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    //console.log(file);
    console.log('FILE::::', file);
    cb(null, file.originalname);
  },
});


// middleware  > multter 
/// upload image to cloudinary

module.exports = {
  uploadImage: async (req, res, next) => {
    let result = {};
    const upload = await multer({ storage }).single("image");   
    if (req.file && req.file.path) {
      upload(req, res, async function (err) {
        if (err) {
          return res.send(err);
        }

        // SEND FILE TO CLOUDINARY

        cloudinary.config({
          cloud_name: "djq3r8ja9",
          api_key: "557642546954897",
          api_secret: "X73ZWlpm5KZbg2WmsTKu5e3JMMo",
        });
        if (!req.file || !req.file.path) {
          // result.error="No file found"
          res.status(400).json({ error: "No file Found" });
        }
        const path = req.file.path;
        const uniqueFilename = new Date().toISOString();

        await cloudinary.uploader.upload(
          path,
          { public_id: `pics/${uniqueFilename}`, tags: `pics` }, // directory and tags are optional
          function (err, image) {
            if (err) {
              res.json(400).json({ error: err.message });
            }
            const fs = require("fs");
            fs.unlinkSync(path);
            console.log("Image url", image.secure_url);
            result.image = image.secure_url;
            req.image = image.secure_url;
            next();
          }
        );
      });
    }
    else{
      next();
    }
    // console.log('result',result)
    // return result;
  },
};
