const gallery = document.getElementById('gallery');
const tagFilters = document.getElementById('tagFilters'); // Make sure you have <div id="tagFilters"></div> in your HTML
const allCards = []; // Store cards with tag text
const allTags = new Set(); // Unique list of tags

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
      const stringTags = record.fields['StringTags'] || '';
      const description = record.fields['Description'] || '';
      const lowerTagText = stringTags.toLowerCase();

      const combinedDetails = `${altText}<br><br>${description}`;
      const combinedID = `${name}<br>${pronouns}`;

      if (images && images.length > 0) {
        const img = document.createElement('img');
        img.src = images[0].url;
        img.alt = title;
        img.style.cursor = 'pointer';

        img.addEventListener('click', () => {
          modalImage.src = images[0].url;
          modalTitle.textContent = title;
          modalID.innerHTML = combinedID;
          console.log(document.getElementById('modalAxis'));

          //modalAxis.innerHTML = `<strong>Axis Label:</strong> ${axis}`;
          if(axis){
          modalAxis.textContent = "Axis Label " + axis; // "Axis Label: " + axis;
        }
          modalDescription.innerHTML = combinedDetails;
          modalTags.textContent = "Tag(s): " + stringTags;
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

      // Store lowercase tag text for filtering
      allCards.push({ card, tagText: lowerTagText });

      // Add individual tags to set
      stringTags.split(',').map(tag => tag.trim().toLowerCase()).forEach(tag => {
        if (tag) allTags.add(tag);
      });
     /* 
      stringTags.split(/[, ]+/).forEach(tag => {
        const trimmed = tag.trim().toLowerCase();
        if (trimmed) allTags.add(trimmed);
      });*/
    });

    // Setup the tag search input and handlers
    const tagSearchControls = setupTagSearch();

    // Expose addSelectedTag globally so "Show All Tags" can use it
    window.addSelectedTag = tagSearchControls.addSelectedTag;

    // Setup the Show All Tags button behavior
    setupShowAllTagsButton();

    //buildTagButtons();
  })
  .catch(error => {
    gallery.textContent = 'Failed to load data.';
    console.error('Fetch error:', error);
  });

// Modal logic
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalID = document.getElementById('modalID');
const modalAxis = document.getElementById('modalAxis');
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

function setupTagSearch() {
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');
  const selectedTagsDiv = document.getElementById('selectedTags');
  const selectedTags = new Set();

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';

    if (!query) return;

    const matchingTags = Array.from(allTags).filter(tag => tag.includes(query) && !selectedTags.has(tag));
    matchingTags.forEach(tag => {
      const div = document.createElement('div');
      div.textContent = tag;
      div.classList.add('tag-suggestion');
      div.addEventListener('click', () => {
        selectedTags.add(tag);
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTags();
        filterCardsBySelectedTags();
      });
      suggestions.appendChild(div);
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent form submit or other side effects
      const firstSuggestion = suggestions.querySelector('.tag-suggestion');
      if (firstSuggestion) {
        firstSuggestion.click();
      }
    }
  });

  function updateSelectedTags() {
    selectedTagsDiv.innerHTML = '';
    selectedTags.forEach(tag => {
      const tagElem = document.createElement('span');
      tagElem.className = 'selected-tag';
      tagElem.textContent = tag;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.className = 'remove-tag';
      removeBtn.addEventListener('click', () => {
        selectedTags.delete(tag);
        updateSelectedTags();
        filterCardsBySelectedTags();
      });

      tagElem.appendChild(removeBtn);
      selectedTagsDiv.appendChild(tagElem);
    });
  }

  function filterCardsBySelectedTags() {
    const andMode = document.getElementById('andMode').checked;
  
    if (selectedTags.size === 0) {
      allCards.forEach(({ card }) => card.style.display = '');
      return;
    }
  
    allCards.forEach(({ card, tagText }) => {
      const tagsArray = tagText.split(',').map(t => t.trim());
      const matches = andMode
        ? Array.from(selectedTags).every(tag => tagsArray.includes(tag))
        : Array.from(selectedTags).some(tag => tagsArray.includes(tag));
  
      card.style.display = matches ? '' : 'none';
    });
  }
  

  document.getElementById('andMode').addEventListener('change', () => {
    filterCardsBySelectedTags();
  });

  // Expose a function to add tags from outside (for Show All Tags button)
  function addSelectedTag(tag) {
    if (!selectedTags.has(tag)) {
      selectedTags.add(tag);
      updateSelectedTags();
      filterCardsBySelectedTags();
    }
  }

  return {
    addSelectedTag
  };
}

function setupShowAllTagsButton() {
  const showAllTagsBtn = document.getElementById('showAllTagsBtn');
  const allTagsList = document.getElementById('allTagsList');

  showAllTagsBtn.addEventListener('click', () => {
    if (allTagsList.style.display === 'none' || allTagsList.style.display === '') {
      // Show and populate the list
      allTagsList.style.display = 'block';
      allTagsList.innerHTML = '';

      // Get currently selected tags to exclude from list
      const selectedTagsSpans = document.querySelectorAll('#selectedTags .selected-tag');
      const selectedTags = new Set(
        Array.from(selectedTagsSpans).map(span => span.textContent.replace('✕', '').trim().toLowerCase())
      );

      Array.from(allTags).sort().forEach(tag => {
        if (selectedTags.has(tag)) return; // skip tags already selected

        const tagDiv = document.createElement('div');
        tagDiv.textContent = tag;
        tagDiv.classList.add('tag-suggestion');
        tagDiv.style.cursor = 'pointer';
        tagDiv.style.padding = '4px 8px';

        tagDiv.addEventListener('click', () => {
          window.addSelectedTag(tag);
          allTagsList.style.display = 'none';

          // Clear search input and suggestions for clean UX
          const input = document.getElementById('tagSearch');
          input.value = '';
          document.getElementById('tagSuggestions').innerHTML = '';
        });

        allTagsList.appendChild(tagDiv);
      });
    } else {
      // Hide the list
      allTagsList.style.display = 'none';
    }
  });
}

document.getElementById('toggleTagFiltersBtn').addEventListener('click', () => {
  const container = document.getElementById('tagFilterContainer');
  container.style.display = container.style.display === 'none' ? 'block' : 'none';
});
