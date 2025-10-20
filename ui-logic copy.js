import {
    canvas,
    setTool,
    //currentTool,
    addShape,
    startDrawingShape,
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
    zoomOut,

  } from './canvas-setup.js';
  
const possessiveOptions = ["my", "the"];
const modifierOptions = ["innate", "external", "situational"];
const identityDescriptors = [
  "I am", "I'm perceived as", "I shift between"
];
const contextDescriptors = [
  "in community", "right now", "always", "consistently"
];

let selectedIdentityDescriptors = [];
let selectedContextDescriptors = [];

let currentShape = null; // 'rect', 'circle', 'triangle', etc.


// === Selected State ===
let selectedPossessive = "my";
let selectedModifiers = [];
let selectedDescriptors = [];

 // let selectedFragments = ["this chart represents", "my", "gender"];

let menuOpen = false;
let allTags = new Set();
let selectedTags = [];
let knownTags = ["stud", "transfeminine", "doll", "cis", "it", "trans", "enby", "t boy", "two spirit", "transneutral"];
let toolstate ="select";
  // === UI and DOM Logic ===
  
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('startupModal');
    const closeBtn = document.getElementById('closeModalBtn');  
    
  
  //  const preview = document.getElementById('colorInput');
    const colorPickerContainer = document.getElementById('colorPickerContainer');
    if (colorPickerContainer) 
      colorPickerContainer.style.display = 'none';
  
    const floatingMenu = document.getElementById("floatingMenu");
    if (floatingMenu) {
      makeDraggable(floatingMenu); // Assuming you defined this globally
    }

  
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

    document.getElementById('toolBtn').addEventListener('mousedown', (e) => {
      e.stopPropagation();
      
      if (colorPickerContainer.style.display === 'none') {
        // Open color picker, but don't change tool mode yet
        colorPickerContainer.style.display = 'flex';
        console.log("opening color picker");
        document.addEventListener('mousedown', handleOutsideClick);
      } else {
        // Close picker only
        closeColorPicker();
        console.log("closing color picker");
      }
    });
    



function closeColorPicker() {
  colorPickerContainer.style.display = 'none';
  //enableDrawing(); // or whatever re-enables it
  document.removeEventListener('mousedown', handleOutsideClick);
}

function handleOutsideClick(e) {
  // If click is outside the color picker and the preview
  if (
    !colorPickerContainer.contains(e.target)
  ) {
    closeColorPicker();
  }
}


  
    document.getElementById('undoBtn')?.addEventListener('click', undo);
    document.getElementById('redoBtn')?.addEventListener('click', redo);
    document.getElementById('clearCanvasBtn')?.addEventListener('click', clearCanvas);

    toggleToolMenu();
    
    //createTemplate();
    initializeSubmissionHandling();

  });
  function enterDrawing() {
    console.log("Switching to draw mode");
    document.getElementById('toolBtn').innerHTML =
    '<span class="material-icons">brush</span>';
    document.getElementById('toolBtn').style.color = getCurrentColor();
    
    enableDrawing();
    toolstate = "draw";
    closeColorPicker();
  }
  
  function leaveDrawing() {
    console.log("Switching to select mode");
    document.getElementById('toolBtn').innerHTML =
      '<span class="material-symbols-outlined material-icons">design_services</span>';

    document.getElementById('toolBtn').style.color = getCurrentColor();
    
    disableDrawing();
    toolstate = "select";
  
    const buttons = document.querySelectorAll('.paint-btn');
    buttons.forEach(btn => btn.style.display = 'none');
    const buttons2 = document.querySelectorAll('.select-btn');
    buttons2.forEach(btn => btn.style.display = 'flex');
  
    closeColorPicker();
    //document.getElementById('resetBtn').style.display = 'flex';
  }
  

   

/*
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
   const buttons = document.querySelectorAll('.paint-btn');
        buttons.forEach(btn => {
            btn.style.display = 'none';
        });
        const buttons2 = document.querySelectorAll('.select-btn');
        buttons2.forEach(btn => {
            btn.style.display = 'flex';
        });
        closeColorPicker();
        
      //  document.getElementById('colorInput').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'flex';

  }
*/
  function closeColorPicker(){
    colorPickerContainer.style.display = 'none';
   // enterDrawing();
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
        //document.getElementById('resetBtn').style.display = 'none';
     //   document.getElementById('colorInput').style.display = 'flex';
        
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
    //console.log(selectedFragments);
    const sentence = document.getElementById("sentencePreview").value;
    //const fragmentsString = selectedFragments.join(" ");
    const svg = canvas.toSVG();
    
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
      sentences: sentence,
      frameworks: JSON.stringify(Object.fromEntries(selectedFrameworksMap)),
      SVG: svg
      
    };
  }
  
  // ========== Submit Listener ==========
  ///////


  function initializeSubmissionHandling() {
    document.getElementById('submissionForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = getFormData();
      
      const popup = document.getElementById('submittingPopup');
      const message = document.getElementById('submissionMessage');
      const viewBtn = document.getElementById('viewGalleryBtn');
  
      popup.style.display = 'block';
      message.textContent = 'Submitting...';
      viewBtn.style.display = 'none';
  
      try {
        const res = await fetch('/.netlify/functions/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
  
        const data = await res.json();
        if (res.ok && data.success) {
          message.textContent = 'Submitted. Thank you!';
          viewBtn.style.display = 'inline-block';
        } else {
          alert('Submission failed: ' + (data.error || 'Unknown error'));
          popup.style.display = 'none';
        }
      } catch (err) {
        alert('Submission failed: Network error');
        console.error(err);
        popup.style.display = 'none';
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

//  allTagsList.innerHTML = '';
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

   // allTagsList.appendChild(div);
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


    function toggleDropdown(id) {
      const dropdown = document.getElementById(id);
      const isHidden = dropdown.classList.contains('hidden');
    
      // Hide all dropdowns first
      document.querySelectorAll('.dropdown').forEach(d => d.classList.add('hidden'));
    
      if (isHidden) {
        const button = document.querySelector(`[onclick*="${id}"]`);
        
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${button.offsetTop + button.offsetHeight}px`;
        
        // Temporarily show dropdown to measure width
        dropdown.classList.remove('hidden');
        
        const buttonCenter = button.offsetLeft + button.offsetWidth / 2;
        let left = buttonCenter - dropdown.offsetWidth / 2;
        
        const viewportWidth = window.innerWidth;
        
        // Prevent overflow on left side
        if (left < 0) left = 0;
        
        // Prevent overflow on right side
        if (left + dropdown.offsetWidth > viewportWidth) {
          left = viewportWidth - dropdown.offsetWidth - 10; // 10px margin
        }
        
        dropdown.style.left = `${left}px`;
      }
      
      
    }
    
    
    function renderSelectableDropdown(containerId, options, selectedList, updateCallback) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
    
      
    
      options.forEach(opt => {
        const div = document.createElement('div');
        div.textContent = opt;
        div.className = 'dropdown-option';
        if (selectedList.includes(opt)) {
          div.classList.add('selected');
        }
    
        div.onclick = () => {
          const idx = selectedList.indexOf(opt);
          if (idx === -1) {
            selectedList.push(opt);
          } else {
            selectedList.splice(idx, 1);
          }
          updateCallback();
        };
    
        container.appendChild(div);
      });

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕ Close';
      closeBtn.className = 'dropdown-close';
      closeBtn.type = "button";
      closeBtn.onclick = () => {
        container.classList.add('hidden');
      };
      container.appendChild(closeBtn);
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

  
  
  // === Possessive Selector ===
  function renderRadioDropdown(containerId, options, selectedValue, updateCallback) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'dropdown-option';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = containerId; // ensures only one is selected
      radio.value = opt;
      radio.checked = opt === selectedValue;
  
      radio.addEventListener('change', () => {
        updateCallback(opt);
      });
  
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + opt));
      container.appendChild(label);
      
    });
          // Close button
          const closeBtn = document.createElement('button');
          closeBtn.textContent = '✕ Close';
          closeBtn.className = 'dropdown-close';
          closeBtn.type = "button";
          closeBtn.onclick = () => {
            container.classList.add('hidden');
          };
          container.appendChild(closeBtn);
  }
  
  
  // === Modifier/Descriptor Selector with Drag ===
  function renderMultiSelect(selectId, options, selectedList, updateCallback) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
  
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      if (selectedList.includes(opt)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  
    select.addEventListener('change', () => {
      const selected = Array.from(select.selectedOptions).map(o => o.value);
      selectedList.length = 0;
      selectedList.push(...selected);
      updateCallback();
    });
  }
  
  function oxfordJoin(arr) {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return arr[0] + ' and ' + arr[1];
    return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1];
  }
  
  // === Sentence Preview (textarea) ===
  function updateSentencePreview() {
    const textarea = document.getElementById("sentencePreview");
  
    const modifiersStr = oxfordJoin(selectedModifiers);
  const identityStr = oxfordJoin(selectedIdentityDescriptors);
  const contextStr = oxfordJoin(selectedContextDescriptors);


    let sentence = `This chart represents ${selectedPossessive}` 
    if(modifiersStr) 
      sentence += ` ${modifiersStr} gender`;
    else
      sentence += ` gender`;
    if (identityStr) {
      sentence += ` that ${identityStr}`;
    }
    if(contextStr)
      sentence += ` ${contextStr}.`;
    else
    sentence += `.`;

    textarea.value = sentence;
  }
  
  
  // === Rendering Everything ===
  function renderAll() {
    renderRadioDropdown('possessiveDropdown', possessiveOptions, selectedPossessive, (newVal) => {
      selectedPossessive = newVal;
      renderAll();
    });
  
    renderSelectableDropdown('modifierDropdown', modifierOptions, selectedModifiers, renderAll);
    renderSelectableDropdown('identityDescriptorDropdown', identityDescriptors, selectedIdentityDescriptors, renderAll);
    renderSelectableDropdown('contextDescriptorDropdown', contextDescriptors, selectedContextDescriptors, renderAll);
  
    updateSentencePreview();
  }
  

  
  renderAll();
  const shapesMenu = document.getElementById('shapesMenu');
const toggleBtn = document.getElementById('toggleShapesMenu');

toggleBtn.addEventListener('click', () => {
  if (shapesMenu.style.display === 'none' || shapesMenu.style.display === '') {
    shapesMenu.style.display = 'flex'; // or 'block' depending on your layout
  } else {
    shapesMenu.style.display = 'none';
  }
});

function addShapeButton(shapeType) {
  addShape(shapeType);
  //change button icon
  closeColorPicker();
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
window.toggleDropdown = toggleDropdown;
window.addShape = addShapeButton,
//window.openColorMenu = openColorMenu;


  
window.resetCanvasView = resetCanvasView;
window.addTagButton = addTagButton;



