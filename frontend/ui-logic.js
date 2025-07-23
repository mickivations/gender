import {
    canvas,
    setTool,
    //currentTool,
    getCurrentColor,
    setCurrentColor,
    undo,
    redo,
    clearCanvas,
    addText,
    updatePreview,
    //allTags,
    //selectedTags,
    enableDrawing,
    disableDrawing,
    createTemplate,
    resizeCanvas,
    deleteObject,
    duplicateObject,
    zoomIn,
    zoomOut
  } from './canvas-setup.js';

  let sentenceFragments = [
    "in transition",
    "in homeostasis",
    "innate",
    "external",
    "I want",
    "I am",
    "Right now",
    "Over time",
    "I move between",
    "Gender I'm perceived",
    "The gender I'm fine with",
    "Like",
    "Don't like",
    "In community",
    "With"
  ];
  
  let selectedFragments = [];

let menuOpen = false;
let allTags = new Set();
let selectedTags = [];
let knownTags = ["stud", "transfeminine", "doll", "cis", "it", "trans", "enby", "t boy", "two spirit", "transneutral"];
let toolstate ="select";
  // === UI and DOM Logic ===
  
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('startupModal');
    const closeBtn = document.getElementById('closeModalBtn');  
    
  
    const preview = document.getElementById('colorInput');
    const colorPickerContainer = document.getElementById('colorPickerContainer');
    if (colorPickerContainer) colorPickerContainer.style.display = 'none';
  
    const floatingMenu = document.getElementById("floatingMenu");
    if (floatingMenu) {
      makeDraggable(floatingMenu); // Assuming you defined this globally
    }
  
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      renderFrameworkSubmitList(); // Assuming this exists globally
    });
  
    const colorPicker = new iro.ColorPicker('#iroContainer', {
      color: '#ffff00'
    });
  
    updatePreview(getCurrentColor());
    
    colorPicker.on('color:change', function(color) {
      setCurrentColor(color.hexString);
      updatePreview(getCurrentColor());
      if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = getCurrentColor();
      }
    });
     // When preview clicked, toggle picker visibility
    preview.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // prevent triggering canvas draw
        if (colorPickerContainer.style.display === 'none') {
        disableDrawing();
        const menu = document.getElementById('selectMenu');
        menu.style.display = 'none';
       // const menu2 = document.getElementById('toolMenu');
        //menu2.style.display = "none";
        colorPickerContainer.style.display = 'flex';
    
        } else {
        closeColorPicker();  // will handle drawing mode reset
        }
    });
  
    document.getElementById('undoBtn')?.addEventListener('click', undo);
    document.getElementById('redoBtn')?.addEventListener('click', redo);
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearCanvas);

    toggleToolMenu();
    
    //createTemplate();
    initializeSubmissionHandling();
    renderSentenceFragmentsList();
    updateSentencePreview();

  });
   
  function enterDrawing()
  {
    console.log("starting to draw")
    document.getElementById('toolBtn').innerHTML = '<span class="material-symbols-outlined material-icons">edit_off</span>';
    document.getElementById('toolBtn').style.color = '#ffffff';
   enableDrawing();
   toolstate = "draw";
  }
  
  function leaveDrawing()
  {
    //console.log("starting to draw")
    document.getElementById('toolBtn').innerHTML = '<span class="material-icons">brush</span>';
    document.getElementById('toolBtn').style.color = getCurrentColor();
    disableDrawing();
   toolstate = "select";
  }

  function closeColorPicker(){
    colorPickerContainer.style.display = 'none';
    enterDrawing();
   // const menu2 = document.getElementById('toolMenu');
     // menu2.style.display = "none";
  }

function makeDraggable(el) {
let offsetX = 0, offsetY = 0, isDragging = false;

// Mouse Events
el.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', doDrag);
document.addEventListener('mouseup', stopDrag);

// Touch Events
el.addEventListener('touchstart', startDrag, { passive: false });
document.addEventListener('touchmove', doDrag, { passive: false });
document.addEventListener('touchend', stopDrag);

function startDrag(e) {
    const target = e.target;

    // Don't drag if the user started on a button or input
    if (['BUTTON'].includes(target.tagName)) {
    return;
    }

    isDragging = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = el.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    el.style.cursor = 'move';
    if (e.touches) e.preventDefault(); // prevent scrolling while dragging
}


function doDrag(e) {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    el.style.left = `${clientX - offsetX}px`;
    el.style.top = `${clientY - offsetY}px`;
    el.style.transform = 'none'; // Disable centering transform during drag
    if (e.touches) e.preventDefault();
}

function stopDrag() {
    isDragging = false;
    el.style.cursor = 'default';
}
}
function closeToolMenu() {
    const menu = document.getElementById('toolMenu');
    menu.style.display ='none';
    }

function toggleToolMenu() {
    if(toolstate === "draw")
    {
        leaveDrawing();
          
        const buttons = document.querySelectorAll('.paint-btn');
        buttons.forEach(btn => {
            btn.style.display = 'none';
        });
        const buttons2 = document.querySelectorAll('.select-btn');
        buttons2.forEach(btn => {
            btn.style.display = 'flex';
        });

        
        document.getElementById('colorInput').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'flex';
    }
    else
    {
        enterDrawing();
        
        const buttons2 = document.querySelectorAll('.select-btn');
        buttons2.forEach(btn => {
            btn.style.display = 'none';
        });
        const buttons = document.querySelectorAll('.paint-btn');
        buttons.forEach(btn => {
            btn.style.display = 'flex';
        });
        document.getElementById('resetBtn').style.display = 'none';
        document.getElementById('colorInput').style.display = 'flex';
        
    }
    //const menu = document.getElementById('toolMenu');
   // menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}
function toggleSliderMenu() {
const menu = document.getElementById('sliderMenu');
menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
function toggleShapesMenu() {
const menu = document.getElementById('shapesSubMenu');
menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}


function toggleSelectMenu() {
//const menu = document.getElementById('selectMenu');
//menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
/*const menu2 = document.getElementById('brushMenu');
menu2.style.display = menu2.style.display === 'flex' ? 'none' : 'flex'; */
}

function closeSelectMenu() {
    const menu = document.getElementById('selectMenu');
    menu.style.display = 'none';
    /*const menu2 = document.getElementById('brushMenu');
    menu2.style.display = "flex";*/
}

function openSubmitMenu(){
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1.0
  });

  const img = document.getElementById('canvasPreview');
  img.src = dataURL;

  const menu = document.getElementById('submitMenu');
  menu.style.display = 'block';

  history.pushState({ menuOpen: true }, '');
  menuOpen = true;



}

function closeSubmitMenu() {
  const menu = document.getElementById('submitMenu');
  menu.style.display =  'none';
  menuOpen = false;

}

// Listen to back/forward navigation
window.addEventListener('popstate', (event) => {
  if (menuOpen) {
    closeSubmitMenu(); // close the menu instead of navigating away
  } 
}); 

function toggleHiddenInputs() {
    const hiddenInputsDiv = document.getElementById('hidden-inputs');
    const currentDisplay = window.getComputedStyle(hiddenInputsDiv).display;
  
    if (currentDisplay === 'none') {
      hiddenInputsDiv.style.display = 'block';
    } else {
      hiddenInputsDiv.style.display = 'none';
    }
  }

//////////////


// ========== Canvas Preview ==========
function updateCanvasPreview() {
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0
    });
    const previewImg = document.getElementById('canvasPreview');
    previewImg.src = dataURL;
  }
  
  // ========== Framework Submission Map ==========
  const selectedFrameworksMap = new Map();
  
  // ========== Form Data Collection ==========
  function getFormData() {
    const getVal = id => document.getElementById(id)?.value.trim() || '';
  
    const base64 = canvas.toDataURL('image/png');
  
    const selectedOptions = [...document.querySelectorAll('input[name="options"]:checked')]
      .map(input => input.value.trim());
  
    const customInputs = [...document.querySelectorAll('#customOptionsContainer input')]
      .map(input => input.value.trim()).filter(Boolean);
  
    const allChoices = [...new Set([...selectedOptions, ...customInputs])];
    const combinedTags = [...new Set([...allChoices, ...selectedTags])].join(', ');
  
    selectedFrameworksMap.clear();
    document.querySelectorAll('#frameworkSubmitList input[type=checkbox]:checked').forEach(cb => {
      const id = cb.value;
      const def = cb.nextElementSibling?.tagName === 'SMALL'
        ? cb.nextElementSibling.textContent.trim()
        : '';
      selectedFrameworksMap.set(id, def);
    });
  
    const customName = getVal('customFrameworkName');
    const customDef = getVal('customFrameworkDefinition');
    if (customName) selectedFrameworksMap.set(customName, customDef);
    console.log(selectedFragments);
    const fragmentsString = selectedFragments.join(" ");
  
    return {
      title: getVal('title'),
      name: getVal('name'),
      pronouns: getVal('pronouns'),
      imageBase64: base64,
      altText: getVal('altText'),
      ax3: getVal('axis3'),
      axisB: getVal('axisB'),
      axisG: getVal('axisG'),
      tags: combinedTags,
      description: getVal('description'),
      sentences: fragmentsString,
      frameworks: JSON.stringify(Object.fromEntries(selectedFrameworksMap))
    };
  }
  
  // ========== Submit Listener ==========
  ///////

function initializeSubmissionHandling() {
    document.getElementById('submissionForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = getFormData();
  
      const res = await fetch('/.netlify/functions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Submission successful!');
      } else {
        alert('Submission failed: ' + (data.error || 'Unknown error'));
      }
    });
  
    fetch('/.netlify/functions/get-tags')
      .then(res => res.json())
      .then(data => {
        const combined = [...new Set(data.tags.concat(knownTags))];
        combined.forEach(tag => allTags.add(tag.toLowerCase()));
        setupTagSearchForForm();
        setupShowAllTagsButtonForForm();
        renderAllTagsList();
      })
      .catch(err => {
        console.error('Failed to load tag suggestions:', err);
        knownTags.forEach(tag => allTags.add(tag.toLowerCase()));
        setupTagSearchForForm();
        setupShowAllTagsButtonForForm();
        renderAllTagsList();
      });

      closeSubmitMenu();
  }


function setupTagSearchForForm() {
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';
    if (!query) return;

    const matching = Array.from(allTags).filter(tag =>
      tag.startsWith(query) && !selectedTags.includes(tag)
    );

    matching.forEach(tag => {
      const div = document.createElement('div');
      div.textContent = tag;
      div.className = 'tag-suggestion';
      div.style.cursor = 'pointer';
      div.style.padding = '4px 8px';
      div.addEventListener('click', () => {
        addTag(tag);
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTagsUI();
        renderAllTagsList();
      });
      suggestions.appendChild(div);
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (val && !selectedTags.includes(val)) {
        addTag(val);
        allTags.add(val);
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTagsUI();
        renderAllTagsList();
      }
    }
  });
}

function addTagButton(){
    //e.preventDefault();
    console.log("adding tag");
    const val = document.getElementById('tagSearch').value.trim().toLowerCase();
    if (val && !selectedTags.includes(val)) {
        addTag(val);
        allTags.add(val);
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTagsUI();
        renderAllTagsList();
      }
}

function updateSelectedTagsUI() {
  const selectedTagsDiv = document.getElementById('selectedTags');
  const hiddenInput = document.getElementById('selectedTagsInput');

  selectedTagsDiv.innerHTML = '';

  selectedTags.forEach((tag, index) => {
    const tagElem = document.createElement('span');
    tagElem.className = 'selected-tag';
    tagElem.textContent = tag;
    tagElem.draggable = true; // Make draggable

    // Drag event handlers
    tagElem.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
      tagElem.style.opacity = '0.5';
    });
    tagElem.addEventListener('dragend', (e) => {
      tagElem.style.opacity = '1';
    });

    tagElem.addEventListener('dragover', (e) => {
      e.preventDefault(); // Allow drop
      tagElem.style.border = '2px dashed #666';
    });

    tagElem.addEventListener('dragleave', (e) => {
      tagElem.style.border = '';
    });

    tagElem.addEventListener('drop', (e) => {
      e.preventDefault();
      tagElem.style.border = '';

      const draggedIndex = e.dataTransfer.getData('text/plain');
      const targetIndex = index;

      if (draggedIndex === '' || draggedIndex == null) return;

      // Reorder array
      const draggedTag = selectedTags[draggedIndex];
      selectedTags.splice(draggedIndex, 1); // remove dragged
      selectedTags.splice(targetIndex, 0, draggedTag); // insert at new pos

      updateSelectedTagsUI(); // re-render UI
    });

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-tag-btn';
    removeBtn.style.marginLeft = '6px';
    removeBtn.addEventListener('click', () => {
      selectedTags.splice(index, 1);
      updateSelectedTagsUI();
      renderAllTagsList();
    });

    tagElem.appendChild(removeBtn);

    // Style
    tagElem.style.marginRight = '8px';
    tagElem.style.display = 'inline-block';
    tagElem.style.padding = '4px 8px';
    tagElem.style.background = '#ddd';
    tagElem.style.borderRadius = '12px';
    tagElem.style.cursor = 'move'; // indicate draggable

    selectedTagsDiv.appendChild(tagElem);
  });

  hiddenInput.value = selectedTags.join(', ');
}


function renderAllTagsList() {
  const allTagsList = document.getElementById('allTagsList');
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');

  allTagsList.innerHTML = '';
  const selected = new Set(selectedTags);

  Array.from(allTags).forEach(tag => {
    if (selected.has(tag)) return;

    const div = document.createElement('div');
    div.textContent = tag;
    div.classList.add('tag-suggestion');
    div.style.cursor = 'pointer';
    div.style.padding = '4px 8px';
    div.style.margin = '4px';
    div.style.display = 'inline-block';
    div.style.background = '#eee';
    div.style.borderRadius = '10px';

    div.addEventListener('click', () => {
      addTag(tag);
      updateSelectedTagsUI();
      input.value = '';
      suggestions.innerHTML = '';
      renderAllTagsList();
    });

    allTagsList.appendChild(div);
  });
}

function setupShowAllTagsButtonForForm() {
  renderAllTagsList();
}

function addTag(tag) {
  if (!selectedTags.includes(tag)) {
    selectedTags.push(tag);
    updateSelectedTagsUI();
    renderAllTagsList();  // if you use this to update other UI
  }
}

function renderSentenceFragmentsList() {
    const container = document.getElementById('sentenceFragmentsList');
    console.log(container);
    container.innerHTML = '';
  
    sentenceFragments.forEach(fragment => {
      if (selectedFragments.includes(fragment)) return;
  
      const div = document.createElement('div');
      div.textContent = fragment;
      div.classList.add('tag-suggestion');
      div.style.cursor = 'pointer';
      div.style.padding = '4px 8px';
      div.style.margin = '4px';
      div.style.display = 'inline-block';
      div.style.background = '#eee';
      div.style.borderRadius = '10px';
  
      div.addEventListener('click', () => {
        selectedFragments.push(fragment);
        updateSelectedFragmentsUI();
        renderSentenceFragmentsList();
        updateSentencePreview();
      });
  
      container.appendChild(div);
    });
  }

function updateSelectedFragmentsUI() {
    const container = document.getElementById('selectedFragments');
    container.innerHTML = '';
  
    selectedFragments.forEach((fragment, index) => {
      const tagElem = document.createElement('span');
      tagElem.className = 'selected-tag';
      tagElem.textContent = fragment;
      tagElem.draggable = true;
  
      tagElem.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        tagElem.style.opacity = '0.5';
      });
      tagElem.addEventListener('dragend', () => {
        tagElem.style.opacity = '1';
      });
      tagElem.addEventListener('dragover', (e) => {
        e.preventDefault();
        tagElem.style.border = '2px dashed #666';
      });
      tagElem.addEventListener('dragleave', () => {
        tagElem.style.border = '';
      });
      tagElem.addEventListener('drop', (e) => {
        e.preventDefault();
        tagElem.style.border = '';
        const draggedIndex = e.dataTransfer.getData('text/plain');
        const targetIndex = index;
        if (draggedIndex == null) return;
  
        const moved = selectedFragments.splice(draggedIndex, 1)[0];
        selectedFragments.splice(targetIndex, 0, moved);
        updateSelectedFragmentsUI();
        updateSentencePreview();
      });
  
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.className = 'remove-tag-btn';
      removeBtn.style.marginLeft = '6px';
      removeBtn.addEventListener('click', () => {
        selectedFragments.splice(index, 1);
        updateSelectedFragmentsUI();
        renderSentenceFragmentsList();
        updateSentencePreview();
      });
  
      tagElem.appendChild(removeBtn);
  
      tagElem.style.marginRight = '8px';
      tagElem.style.display = 'inline-block';
      tagElem.style.padding = '4px 8px';
      tagElem.style.background = '#ddd';
      tagElem.style.borderRadius = '12px';
      tagElem.style.cursor = 'move';
  
      container.appendChild(tagElem);
    });
  }

  
function updateSentencePreview() {
    const preview = document.getElementById('sentencePreview');
    preview.textContent = selectedFragments.join(' ') + (selectedFragments.length ? '.' : '');
  }

  function resetCanvasView() {
    // Reset zoom
    canvas.setZoom(1);
  
    // Reset pan
    canvas.viewportTransform[4] = 0; // x translation
    canvas.viewportTransform[5] = 0; // y translation
  
    // Re-center objects (optional but often good UX)
    canvas.calcOffset();
    canvas.renderAll();
    updateCanvasPreview();
  }

window.toggleToolMenu = toggleToolMenu;
window.toggleSliderMenu = toggleSliderMenu;
window.toggleShapesMenu = toggleShapesMenu;
window.toggleSelectMenu = toggleSelectMenu;
window.closeSelectMenu = closeSelectMenu;
window.openSubmitMenu = openSubmitMenu;
window.closeSubmitMenu = closeSubmitMenu;
window.enableDrawing = enterDrawing;
window.disableDrawing = leaveDrawing;
window.deleteObject = deleteObject;
window.duplicateObject = duplicateObject;
window.undo= undo;
window.redo = redo;
window.toggleHiddenInputs = toggleHiddenInputs;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.closeColorPicker = closeColorPicker;



  
window.resetCanvasView = resetCanvasView;
window.addTagButton = addTagButton;



