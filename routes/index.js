const { promisify } = require('util');
const fs = require('fs');
const readFileAsync = promisify(fs.readFile);
const blobToBuffer = require('blob-to-buffer');
const { toBuffer } = require('blob-util');
// const backgroundRemoval = require('@imgly/background-removal-node');
const {removeBackground} = require("@imgly/background-removal-node");

const axios = require('axios');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { rembg } = require("@remove-background-ai/rembg.js")
const sharp = require("sharp");

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

const API_KEY = "0843280b-4f68-4bb3-816e-308459feb7d6";

// Function to read image and convert to base64
function getImageBase64(filePath) {
  // Read the image file
  const imageBuffer = fs.readFileSync(filePath);

  // Convert the buffer to base64
  const base64Image = imageBuffer.toString('base64');

  return base64Image;
}

// {
//   fieldname: 'file',
//   originalname: 'g9.jpg',
//   encoding: '7bit',
//   mimetype: 'image/jpeg',
//   destination: './images/',
//   filename: '1709129537042g9.jpg',
//   path: 'images\\1709129537042g9.jpg',
//   size: 47706
// }


router.post("/rembg", upload.single('file'), async (req, res) => {
  try {
    console.log("api calling...")
    const image = req.file.filename;

    console.log(req.file, image)
    let data;

    rembg({
      apiKey: API_KEY,
      inputImagePath: `./images/${image}`
    }).then(({ outputImagePath }) => {
      // console.log('✅🎉 background removed and saved under path=', outputImagePath);

      base64Content = getImageBase64(outputImagePath);

      const apiUrl = "https://cdn.brandingprofitable.com/base64.php";
      const requestData = {
        "base64_content": base64Content
      };

      // setTimeout(() => {
        
      axios.post(apiUrl, requestData)
        .then((response) => {

          res.json({
            statusCode: 200,
            message: "success",
            data: "https://cdn.brandingprofitable.com/"+response.data.image_url
          });
        })
        .catch((error) => {
          res.json({
            statusCode: 200,
            message: "rembg",
            data: error.message 
          });
        })

      // }, 2000);

      // if called, it will cleanup (remove from disk) your removed background image
      
    }).catch((e)=>{
      console.log("error", e)
      res.json({
        statusCode: 200,
        message: e,
      });
    })


  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.get('/remove-bg-imgly', async (req, res) => {
  try {
    const image = "https://cdn.brandingprofitable.com/upload/65d82d4eba5a5profile.png";

    let config = {
      debug: true,
      fetchArgs: {
        mode: 'no-cors'
      },
      output: { format: 'image/png', quality: 1 }
    };

    removeBackground(image, config).then(async (blob) => {
      // Convert Blob to Buffer
      const buffer = await blobToBufferr(blob);

      // Use Sharp to convert the image format (e.g., to JPEG)
      const convertedBuffer = await sharp(buffer)
        .toFormat('jpeg') // You can change 'jpeg' to your desired format
        .toBuffer();

      // Now you can use the convertedBuffer as needed
      const base64Data = convertedBuffer.toString('base64');

      res.json({
        statusCode: 200,
        message: "hello remove-bg-imgly",
        data: {
          base64Image: base64Data,
        }
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error removing background');
  }
});

// Function to convert Blob to Buffer
function blobToBufferr(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(Buffer.from(reader.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

router.post("/hi", upload.single('file'), async (req, res) => {
  try {

    res.json({
      statusCode: 200,
      message: "hello rembg",
    });


  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});


module.exports = router;
