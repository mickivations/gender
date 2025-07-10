const res = await fetch('/.netlify/functions/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title,
    name,
    pronouns,
    imageBase64,
    altText,
    ax3,
    tags: Array.from(selectedTags).join(', '),
    description,
  }),
});

const data = await res.json();

if (!res.ok) {
  throw new Error(data.error || 'Unknown error');
}

// ⚠️ Show a warning if fallback was used
if (data.fallback) {
  alert("⚠️ ImgBB upload failed. Image was stored as backup data in Airtable.");
} else {
  alert("✅ Submission successful!");
}
