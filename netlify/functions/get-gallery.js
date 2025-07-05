require('dotenv').config(); // optional for local dev

exports.handler = async function (event, context) {
    const airtableKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;
  
    const airtableEndpoint = `https://api.airtable.com/v0/${baseId}/${tableName}?sort[0][field]=Created&sort[0][direction]=desc`;
  
    try {
      const res = await fetch(airtableEndpoint, {
        headers: {
          Authorization: `Bearer ${airtableKey}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Airtable fetch failed: ${res.status} ${errText}`);
      }
  
      const data = await res.json();
  
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      };
    }
  };
  