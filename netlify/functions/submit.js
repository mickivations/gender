require('dotenv').config();

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' }),
    };
  }

  const { title, name, pronouns, imageBase64, altText, ax3, tags } = JSON.parse(event.body);

  const imgBBKey = process.env.IMGBB_API_KEY;
  const airtableKey = process.env.AIRTABLE_API_KEY;
   const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;
  
  try {
    // Upload image to ImgBB
    const formData = new URLSearchParams();
    formData.append('image', imageBase64.split(',')[1]);
    console.log("Before ImgBB upload");
    console.log("ImgBB API Key:", imgBBKey ? "Present" : "Missing or empty");

    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgBBKey}`, {
      method: 'POST',
      body: formData,
    });

    console.log("After ImgBB upload, status:", uploadRes.status);

   // const uploadData = await uploadRes.json();
   // const imageUrl = uploadData.data.url;
// debug version 
const uploadData = await uploadRes.json();
console.log("ImgBB response:", uploadData);

if (!uploadData.success || !uploadData.data || !uploadData.data.url) {
  throw new Error(
    "ImgBB upload failed: " + (uploadData?.error?.message || JSON.stringify(uploadData))
  );
}

const imageUrl = uploadData.data.url;

    // Send to Airtable
    console.log("Before Airtable update");

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
        },
      }),
    });

    const data = await airtableRes.json();
    console.log("After Airtable update, status:", airtableRes.status);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
  
};
