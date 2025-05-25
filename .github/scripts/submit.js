const axios = require('axios');

const imgbbApiKey = process.env.IMGBB_API_KEY;
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableBaseId = process.env.AIRTABLE_BASE_ID;
const airtableTableName = process.env.AIRTABLE_TABLE_NAME;

// Replace this with the actual data you’ll send in real use
const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANS...';

async function uploadImage() {
  const res = await axios.post('https://api.imgbb.com/1/upload', null, {
    params: {
      key: imgbbApiKey,
      image: sampleImageBase64.split(',')[1], // Strip "data:image..." prefix
    },
  });
  return res.data.data.url;
}

async function sendToAirtable(imageUrl) {
  const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
  await axios.post(airtableUrl, {
    fields: {
      Name: 'Test from GitHub Actions',
      Image: imageUrl,
    },
  }, {
    headers: {
      Authorization: `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

(async () => {
  try {
    const url = await uploadImage();
    await sendToAirtable(url);
    console.log('✅ Submission complete!');
  } catch (err) {
    console.error('❌ Submission failed:', err);
    process.exit(1);
  }
})();
