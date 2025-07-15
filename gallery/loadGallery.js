const gallery = document.getElementById('gallery');
const tagFilters = document.getElementById('tagFilters'); // Make sure you have <div id="tagFilters"></div> in your HTML
const allCards = []; // Store cards with tag text
const allTags = new Set(); // Unique list of tags

// Modal logic
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalID = document.getElementById('modalID');
const modalAxis = document.getElementById('modalAxis');
const modalDescription = document.getElementById('modalDescription');
const modalTags = document.getElementById('modalTags');
const modalFrameworks = document.getElementById('modalFrameworks');
const modalAltText = document.getElementById('modalAltText');
const closeModal = document.getElementById('closeModal');

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
      const axis3 = record.fields['Axis3'] || '';
      const axisb = record.fields['AxisB'] || '';
      const axisg = record.fields['AxisG'] || '';
      const frameworks = record.fields['Frameworks'] || '';

      const stringTags = record.fields['StringTags'] || '';
      const description = record.fields['Description'] || '';
      const lowerTagText = stringTags.toLowerCase();

      const combinedDetails = `${altText}<br><br>${description}`;
      const combinedID = `${name}<br>${pronouns}`;

      const img = document.createElement('img');
      img.alt = title;
      img.style.cursor = 'pointer';
      
      if (images && images.length > 0) {
        img.src = images[0].url;
      } else if (record.fields['ImageBase64']) {
        img.src = record.fields['ImageBase64'];
      } else {
        img.src = ''; // or a placeholder image URL if you want
      }
      
      img.addEventListener('click', () => {

        if (images && images.length > 0) {
          modalImage.src = images[0].url;
        } else if (record.fields['ImageBase64']) {
          modalImage.src = record.fields['ImageBase64'];
        } else {
          modalImage.src = ''; // or placeholder
        }
        
        modalTitle.textContent = title;
        modalID.innerHTML = combinedID;
        
        if (axis3) {
          modalAxis.textContent = "Axis 3 Label: " + axis3;
        } else {
          modalAxis.textContent = "";
        }
        
        modalDescription.innerHTML = combinedDetails;
        modalTags.textContent = "Tag(s): " + stringTags;
        
        // ⬇️ Frameworks display
        const frameworksContainer = document.getElementById('modalFrameworks');
        frameworksContainer.innerHTML = ''; // clear previous
        
        if (frameworks) {
          let parsedFrameworks;
          try {
            parsedFrameworks = typeof frameworks === 'string' ? JSON.parse(frameworks) : frameworks;
          } catch (err) {
            console.error('Failed to parse frameworks:', err);
            parsedFrameworks = {};
          }
        
          // Header line
          const intro = document.createElement('p');
          intro.className = 'frameworks-intro';
          intro.textContent = 'I believe gender is:';
          frameworksContainer.appendChild(intro);
        
          // Each framework
          Object.entries(parsedFrameworks).forEach(([label, definition]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'framework-item';
        
            const labelElem = document.createElement('div');
            labelElem.className = 'framework-label';
            labelElem.textContent = label;
        
            const defElem = document.createElement('div');
            defElem.className = 'framework-definition';
            defElem.textContent = definition || '(no definition)';
        
            wrapper.appendChild(labelElem);
            wrapper.appendChild(defElem);
            frameworksContainer.appendChild(wrapper);
          });
        }
        
                

        
        modalAltText.innerHTML = altText;
        modalDescription.innerHTML = combinedDetails;
        modalTags.textContent = "Tag(s): " + stringTags;
        modal.style.display = 'flex';
      });
      
      card.appendChild(img);
      

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

      if (axis3) {
        const p = document.createElement('p');
        const span = document.createElement('span');
        span.className = 'values';
        span.textContent = axis3;
        p.append('Axis 3 Label: ', span);
        card.appendChild(p);
      }

      



      gallery.appendChild(card);

      const searchableText = [
        title,
        name,
        axis3, 
        pronouns,
        altText,
        description,
        stringTags
      ].join(' ').toLowerCase();
      
      allCards.push({ card, tagText: lowerTagText, searchableText });
      

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
  
    // Show or hide the clear button
    document.getElementById('clearSearchBtn').style.display = query ? 'inline-block' : 'none';
  
    if (!query) {
      filterCardsBySearchText('');
      return; // ✅ exit early, so suggestions don’t get shown
    }
  
    // Show matching tag suggestions
    const matchingTags = Array.from(allTags).filter(tag =>
      tag.startsWith(query) && !selectedTags.has(tag)
    );
    
  
    matchingTags.forEach(tag => {
      const div = document.createElement('div');
      div.textContent = tag;
      div.classList.add('tag-suggestion');
      div.addEventListener('click', () => {
        selectedTags.add(tag);
        input.value = '';
        suggestions.innerHTML = '';
        document.getElementById('clearSearchBtn').style.display = 'none';
        updateSelectedTags();
        filterCardsBySelectedTags();
      });
      suggestions.appendChild(div);
    });
  
    filterCardsBySearchText(query);
  });

 
  document.getElementById('clearSearchBtn').addEventListener('click', () => {
    input.value = '';
    suggestions.innerHTML = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    filterCardsBySearchText('');
  });
    
  
  function filterCardsBySearchText(query) {
    if (!query) {
      allCards.forEach(({ card }) => card.style.display = '');
      return;
    }
  
    allCards.forEach(({ card, searchableText }) => {
      card.style.display = searchableText.includes(query) ? '' : 'none';
    });
  }

  
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
      
        // Show tag again in the All Tags list if it exists
        if (window.tagElementsMap && window.tagElementsMap.has(tag)) {
          const tagDiv = window.tagElementsMap.get(tag);
          tagDiv.style.display = 'inline-block';
        }
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
        ? Array.from(selectedTags).every(tag => tagsArray.includes(tag) || searchableText.includes(tag))
        : Array.from(selectedTags).some(tag => tagsArray.includes(tag) || searchableText.includes(tag));

  
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
  const tagElementsMap = new Map(); // Track tag elements

  showAllTagsBtn.addEventListener('click', () => {
    if (allTagsList.style.display === 'none' || allTagsList.style.display === '') {
      allTagsList.style.display = 'flex';

      // (Re)populate or update the tag list
      Array.from(allTags).sort().forEach(tag => {
        let tagDiv;

        // If we’ve already created it, reuse
        if (tagElementsMap.has(tag)) {
          tagDiv = tagElementsMap.get(tag);
        } else {
          // Create new tag div
          tagDiv = document.createElement('div');
          tagDiv.textContent = tag;
          tagDiv.classList.add('tag');
          tagDiv.style.cursor = 'pointer';
          tagDiv.style.padding = '4px 8px';

          tagDiv.addEventListener('click', () => {
            window.addSelectedTag(tag);
            tagDiv.style.display = 'none'; // Just hide it
            const input = document.getElementById('tagSearch');
            input.value = '';
            document.getElementById('tagSuggestions').innerHTML = '';
          });

          tagElementsMap.set(tag, tagDiv);
        }

        // Add to DOM if not already present
        if (!allTagsList.contains(tagDiv)) {
          allTagsList.appendChild(tagDiv);
        }

        // Show or hide based on whether it’s already selected
        const selectedTagsSpans = document.querySelectorAll('#selectedTags .selected-tag');
        const selectedTags = new Set(
          Array.from(selectedTagsSpans).map(span => span.textContent.replace('✕', '').trim().toLowerCase())
        );

        tagDiv.style.display = selectedTags.has(tag) ? 'none' : 'inline-block';
      });

    } else {
      allTagsList.style.display = 'none';
    }
  });

  // Make the tagElementsMap accessible for re-showing on unselect
  window.tagElementsMap = tagElementsMap;
}


document.getElementById('toggleTagFiltersBtn').addEventListener('click', () => {
  const container = document.getElementById('tagFilterContainer');
  container.style.display = container.style.display === 'none' ? 'block' : 'none';
});
