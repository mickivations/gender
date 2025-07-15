require('dotenv').config();

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST requests allowed' }),
    };
  }

  try {
    const { title, name, pronouns, imageBase64, altText, ax3, axisB, axisG, tags, description, frameworks } = JSON.parse(event.body);

    console.log("Base64 length:", imageBase64.length);
    console.log("Base64 preview:", imageBase64.slice(0, 100));

    const imgBBKey = process.env.IMGBB_API_KEY;
    const airtableKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    let imageUrl = null;
    let fallbackUsed = false;

    // Try uploading to ImgBB
    try {
      const formData = new URLSearchParams();
      formData.append('image', imageBase64.split(',')[1]);

      console.log("Before ImgBB upload");
      console.log("ImgBB API Key:", imgBBKey ? "Present" : "Missing or empty");

      const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgBBKey}`, {
        method: 'POST',
        body: formData,
      });

      console.log("After ImgBB upload, status:", uploadRes.status);

      const text = await uploadRes.text();

      let uploadData;
      try {
        uploadData = JSON.parse(text);
      } catch (err) {
        throw new Error("Failed to parse ImgBB response as JSON: " + text);
      }

      if (!uploadData.success || !uploadData.data || !uploadData.data.url) {
        throw new Error("ImgBB upload failed: " + JSON.stringify(uploadData));
      }

      imageUrl = uploadData.data.url;
    } catch (err) {
      console.error("ImgBB upload failed, falling back to base64. Reason:", err.message);
      fallbackUsed = true;
    }

    // Prepare Airtable fields
    const fields = {
      Title: title,
      Name: name,
      pronouns: pronouns,
      AltText: altText,
      Axis3: ax3,
      StringTags: tags,
      Description: description,
      AxisB: axisB,
      AxisG: axisG,
      Frameworks: frameworks,
    };

    if (fallbackUsed) {
      fields.ImageBase64 = imageBase64; // Airtable Long Text field for fallback
    } else {
      fields.Image = [{ url: imageUrl }]; // Airtable Attachment field
    }

    console.log("Sending these fields to Airtable:", fields);

    // Send to Airtable
    const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${airtableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    const data = await airtableRes.json();
    console.log("Airtable response:", data);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, fallback: fallbackUsed, data }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
