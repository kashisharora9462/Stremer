import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); // specify the destination directory. cb is a callback function used for asynchronous operations.
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);// create a unique suffix using current timestamp and using some random number.
        cb(null, uniqueSuffix + '-' + file.originalname); // specify the file name
    }
});


//storage is used as middleware to handle file upload and save the file to specified destination with specified filename.

const upload = multer({ storage });

export { upload };