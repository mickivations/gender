require('dotenv').config();

exports.handler = async function (event, context) {
  console.log("get-tags: trying to fetch");

  const airtableKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!airtableKey || !baseId || !tableName) {
    console.error("Missing Airtable env vars", { airtableKey, baseId, tableName });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Airtable environment variables" }),
    };
  }

  const airtableEndpoint = `https://api.airtable.com/v0/${baseId}/${tableName}?fields[]=StringTags&pageSize=100`;

  try {
    const res = await fetch(airtableEndpoint, {
      headers: {
        Authorization: `Bearer ${airtableKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Airtable fetch failed", res.status, errText);
      throw new Error(`Airtable fetch failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    console.log(`Fetched ${data.records.length} records`);

    const tagsSet = new Set();

    data.records.forEach(record => {
      const tagString = record.fields?.StringTags || '';
      tagString.split(',')
        .map(tag => tag.trim().toLowerCase())
        .forEach(tag => {
          if (tag) tagsSet.add(tag);
        });
    });

    const tagsArray = Array.from(tagsSet).sort();
    console.log("Extracted tags:", tagsArray);

    return {
      statusCode: 200,
      body: JSON.stringify({ tags: tagsArray }),
    };
  } catch (err) {
    console.error("Error in get-tags", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
