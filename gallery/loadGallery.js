const AIRTABLE_API_KEY = 'patrgI0a9jrqSYQFl.0aeb268d8112aadea5cc60363ecc57994754d7d2b3a6dc71cdee307f23d9cfff';
const AIRTABLE_BASE_ID = 'appMnJ5OpcAn5M282';
const AIRTABLE_TABLE_NAME = 'Submissions'; 

//const airtableEndpoint = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
const airtableEndpoint = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort[0][field]=Created&sort[0][direction]=desc`;

const gallery = document.getElementById('gallery');

fetch(airtableEndpoint, {
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not OK');
  }
  return response.json();
})
.then(data => {
  gallery.innerHTML = ''; // Clear loading message

  data.records.forEach(record => {
    const card = document.createElement('div');
    card.className = 'card';
  
    // Adjust these field names to match your Airtable exactly
    const images = record.fields['Image']; // assuming this field holds an array of images
    const title = record.fields['Title'] || '';
    const name = record.fields['Name'] || '';
    const pronouns = record.fields['pronouns'] || '';
    const altText = record.fields['AltText'] || '';
    const axis = record.fields['AxisLabel'] || '';
    const tags = record.fields['Tags'] || '';
    const stringTags = record.fields['StringTags'] || '';
    const description = record.fields['Description'] || '';

    let combinedDetails = `${altText}<br><br>${description}`;

    if (images && images.length > 0) {
      const img = document.createElement('img');
      img.src = images[0].url;
      img.alt = title;
      img.style.cursor = 'pointer';
    
       // Add click event to open modal
  img.addEventListener('click', () => {
    modalImage.src = images[0].url;
    modalTitle.textContent = title;
    modalDescription.innerHTML = combinedDetails;
    console.log("combined:", description);
    modalTags.textContent = "Tag(s): "+ tags + stringTags;
    modal.style.display = 'flex';
  });
    
      card.appendChild(img);
    }
    

    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      card.appendChild(h3);
    }

    if (name) {
      const p = document.createElement('p');
      const span = document.createElement('span');
      span.className = 'values'; // Your custom style hook
      span.textContent = name;
      p.append('Name: ', span);
      card.appendChild(p);
    }
    
    if (pronouns) {
      const p = document.createElement('p');
      const span = document.createElement('span');
      span.className = 'values'; // Your custom style hook
      span.textContent = pronouns;
      p.append('Pronouns: ', span);
      card.appendChild(p);
    }

    if (axis) {
      const p = document.createElement('p');
      const span = document.createElement('span');
      span.className = 'values'; // Your custom style hook
      span.textContent = axis;
      p.append('Axis Label: ', span);
      card.appendChild(p);
    }
  

    gallery.appendChild(card);
  });
})
.catch(error => {
  gallery.textContent = 'Failed to load data.';
  console.error('Fetch error:', error);
});

// Get modal elements
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalTags = document.getElementById('modalTags');
const closeModal = document.getElementById('closeModal');

// Attach close event
closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});
