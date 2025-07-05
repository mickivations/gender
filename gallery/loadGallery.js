const gallery = document.getElementById('gallery');

// Fetch gallery data from Netlify function
fetch('/.netlify/functions/get-gallery')
  .then(res => res.json())
  .then(data => {
    console.log('Fetched gallery data:', data);
    gallery.innerHTML = ''; // Clear loading message

    data.records.forEach(record => {
      const card = document.createElement('div');
      card.className = 'card';

      const images = record.fields['Image'];
      const title = record.fields['Title'] || '';
      const name = record.fields['Name'] || '';
      const pronouns = record.fields['pronouns'] || '';
      const altText = record.fields['AltText'] || '';
      const axis = record.fields['AxisLabel'] || '';
      const tags = record.fields['Tags'] || '';
      const stringTags = record.fields['StringTags'] || '';
      const description = record.fields['Description'] || '';

      const combinedDetails = `${altText}<br><br>${description}`;

      if (images && images.length > 0) {
        const img = document.createElement('img');
        img.src = images[0].url;
        img.alt = title;
        img.style.cursor = 'pointer';

        img.addEventListener('click', () => {
          modalImage.src = images[0].url;
          modalTitle.textContent = title;
          modalDescription.innerHTML = combinedDetails;
          modalTags.textContent = "Tag(s): " + tags + stringTags;
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
        span.className = 'values';
        span.textContent = name;
        p.append('Name: ', span);
        card.appendChild(p);
      }

      if (pronouns) {
        const p = document.createElement('p');
        const span = document.createElement('span');
        span.className = 'values';
        span.textContent = pronouns;
        p.append('Pronouns: ', span);
        card.appendChild(p);
      }

      if (axis) {
        const p = document.createElement('p');
        const span = document.createElement('span');
        span.className = 'values';
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

// Modal logic
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalTags = document.getElementById('modalTags');
const closeModal = document.getElementById('closeModal');

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});
