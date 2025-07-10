require('dotenv').config();
const { blobs } = await import('@netlify/blobs');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' }),
    };
  }

  try {
    const { title, name, pronouns, imageBase64, altText, ax3, tags, description } = JSON.parse(event.body);

    // Extract base64 content
    const base64Data = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `gender-gallery/${timestamp}.png`;

    // Upload to Netlify Blob Storage
    const blobStore = blobs();
    await blobStore.set(filename, buffer, {
      contentType: 'image/png',
    });

    // Get public URL
    const imageUrl = blobStore.getURL(filename);

    // Send to Airtable
    const airtableRes = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Title: title,
          Name: name,
          pronouns: pronouns,
          AltText: altText,
          AxisLabel: ax3,
          StringTags: tags,
          Image: [{ url: imageUrl }],
          Description: description,
        },
      }),
    });

    const data = await airtableRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
