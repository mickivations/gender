require('dotenv').config();

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' }),
    };
  }

  const { title, name, pronouns, imageBase64, altText, ax3, tags, description } = JSON.parse(event.body);
  console.log("Base64 length:", imageBase64.length);
console.log("Base64 preview:", imageBase64.slice(0, 100));


  const imgBBKey = process.env.IMGBB_API_KEY;
  const airtableKey = process.env.AIRTABLE_API_KEY;
   const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;
  
  try {
    // Upload image to ImgBB
    console.log("Before ImgBB upload");
console.log("ImgBB API Key:", imgBBKey ? "Present" : "Missing or empty");

// Handle base64 string carefully
if (!imageBase64 || typeof imageBase64 !== 'string') {
  throw new Error("No imageBase64 string provided.");
}

const parts = imageBase64.split(',');
if (parts.length < 2 || !parts[1]) {
  throw new Error("Base64 string is malformed or missing image data.");
}

console.log("Base64 length:", imageBase64.length);
console.log("Base64 preview:", imageBase64.slice(0, 100));

const base64Body = parts[1];
const formData = new URLSearchParams();
formData.append('image', base64Body);

const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgBBKey}`, {
  method: 'POST',
  body: formData,
});


    console.log("After ImgBB upload, status:", uploadRes.status);

   // const uploadData = await uploadRes.json();
   // const imageUrl = uploadData.data.url;
// debug version 

console.log("ImgBB upload response status:", uploadRes.status);
const text = await uploadRes.text();  // Safely read raw response
console.log("ImgBB raw response body:", text);

let uploadData;
try {
  uploadData = JSON.parse(text);
} catch (err) {
  throw new Error("Failed to parse ImgBB response as JSON: " + text);
}


console.log("ImgBB response:", uploadData);


if (!uploadData.success || !uploadData.data || !uploadData.data.url) {
  throw new Error(
    "ImgBB upload failed: " + (uploadData?.error?.message || JSON.stringify(uploadData))
  );
}

const imageUrl = uploadData.data.url;

    // Send to Airtable
    console.log("Before Airtable update", description);

    const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${airtableKey}`,
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
console.log("Airtable response:", data);
console.log("After Airtable update, status:", airtableRes.status);

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
