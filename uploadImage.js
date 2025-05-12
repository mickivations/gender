// netlify/functions/uploadImage.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');  // For unique image names

exports.handler = async (event, context) => {
  try {
    // Parse incoming JSON request body
    const data = JSON.parse(event.body);
    const { imageBase64, notes } = data;

    // Check if image and notes are provided
    if (!imageBase64 || !notes) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Image and notes are required.' }),
      };
    }

    // Convert base64 image data into a buffer
    const buffer = Buffer.from(imageBase64, 'base64');

    // Define the S3 bucket and file name
    const bucketName = 'your-s3-bucket-name';
    const fileName = `images/${uuidv4()}.jpg`;  // Generate a unique file name

    // Upload the image to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',  // Allow public read access (you can adjust this)
    };

    const s3Response = await s3.upload(uploadParams).promise();

    // Return success with the file URL and notes
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        fileUrl: s3Response.Location, // URL of the uploaded image
        notes: notes, // The creator's notes
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error uploading image', error: error.message }),
    };
  }
};
