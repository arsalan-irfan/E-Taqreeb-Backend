const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: "djq3r8ja9",
    api_key: "557642546954897",
    api_secret: "X73ZWlpm5KZbg2WmsTKu5e3JMMo"
  });

exports.uploads = (file, folder) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, (result) => {
            resolve({
                url: result.url,
                id: result.public_id
            })
        }, {
            resource_type: "auto",
            folder: folder
        })
    })
}