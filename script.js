
  // Create canvas
  const canvas = new fabric.Canvas('c');
  const allTags = new Set();
const selectedTags = new Set();
canvas.setBackgroundColor('#000000', canvas.renderAll.bind(canvas));



let currentColor = '#ffff00';  // Default color
const preview = document.getElementById('colorInput');
const colorPickerContainer = document.getElementById('colorPickerContainer');
colorPickerContainer.style.display = 'none';


document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('startupModal');
  const closeBtn = document.getElementById('closeModalBtn');

 // modal.style.display = 'flex'; // Show the modal when page loads

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none'; 
    renderFrameworkSubmitList();

  });

  const colorPicker = new iro.ColorPicker('#iroContainer', {
    color: '#ffff00'
  });

  preview.style.backgroundColor = currentColor;
  colorPicker.on('color:change', function(color) {
    currentColor = color.hexString;
    console.log('Color changed to:', color.hexString);
    updateDrawingColor();
  });

});


 // When preview clicked, toggle picker visibility
 preview.addEventListener('mousedown', (e) => {
  e.stopPropagation(); // prevent triggering canvas draw
  if (colorPickerContainer.style.display === 'none') {
    disableDrawing();
    colorPickerContainer.style.display = 'flex';
  } else {
    closeColorPicker();  // will handle drawing mode reset
  }
});

document.addEventListener('click', (e) => {
  setTimeout(() => {
    const isClickInsidePicker = colorPickerContainer.contains(e.target);
    const isClickOnPreview = preview.contains(e.target);

    if (!isClickInsidePicker && !isClickOnPreview && colorPickerContainer.style.display === 'flex') {
      closeColorPicker();
    }
  }, 0);
});


function closeColorPicker(){
  colorPickerContainer.style.display = 'none';
  enableDrawing();
}


function scaleCanvasObjectsToFit(newWidth, newHeight) {
  const prevWidth = canvas.getWidth();
  const prevHeight = canvas.getHeight();
  const scaleX = newWidth / prevWidth;
  const scaleY = newHeight / prevHeight;

  canvas.getObjects().forEach((obj) => {
    obj.scaleX *= scaleX;
    obj.scaleY *= scaleY;
    obj.left *= scaleX;
    obj.top *= scaleY;
    obj.setCoords();
  });

  canvas.setWidth(newWidth);
  canvas.setHeight(newHeight);
  canvas.renderAll();
}


//let currentColor = '#ffff00';  // Default color is yellow

// Set up the default opacity to 0.8
let opacityValue = 0.8;
let pendingShapeType = null;
let brushWidth = 5;

let maxRadius = Math.min(canvas.width, canvas.height) / 2.2;
let newRadiiCount = 3;

function addShape(type) {
  disableDrawing();
  pendingShapeType = type;  // Save the type, wait for a click
  setActiveTool(type);
  toggleShapesMenu();  
}

//undo / redo code 
const undoStack = [];
const redoStack = [];
let isRestoringState = false;


function saveState() {
  if (isRestoringState) return;
  redoStack.length = 0;

  const nonTemplateObjects = canvas.getObjects().filter(obj => !obj.templateElement);
  const state = JSON.stringify({
    objects: nonTemplateObjects.map(obj => obj.toObject(['templateElement'])),
    background: canvas.backgroundColor,
    viewportTransform: canvas.viewportTransform
  });

  undoStack.push(state);
  console.log("pushed state");
}



function undo() {
  if (undoStack.length > 1) {
    isRestoringState = true;
    const current = undoStack.pop();
    redoStack.push(current);
    const previous = undoStack[undoStack.length - 1];
    restoreState(previous);
  }
}

function redo() {
  if (redoStack.length > 0) {
    isRestoringState = true;
    const state = redoStack.pop();
    undoStack.push(state);
    restoreState(state);
  }
}

function restoreState(state) {
  const parsed = JSON.parse(state);

  canvas.clear();

  canvas.loadFromJSON({ objects: parsed.objects }, () => {
    if (parsed.viewportTransform) {
      canvas.setViewportTransform(parsed.viewportTransform);
    }
    canvas.setBackgroundColor('#000000', () => {
      createTemplate(); // Only after background is applied
      canvas.renderAll();
      isRestoringState = false;
    });
  });
}



// Save state after changes
['object:added', 'object:modified', 'object:removed'].forEach(event => {
  canvas.on(event, saveState);
});

function duplicateObject() {
  const selectedObject = canvas.getActiveObject();

  if (selectedObject) {
    let duplicatedObject;

    // If the selected object is a group, duplicate the whole group with its contents
    if (selectedObject.type === 'group') {
      duplicatedObject = selectedObject.clone(function(cloned) {
        // Clone each object inside the group individually
        cloned.getObjects().forEach(function(obj) {
          // Ensure each object inside the group gets its own unique color reference
          obj.set({
            fill: obj.fill, // Keep the original fill color
            stroke: obj.stroke, // Keep the original stroke color
          });
        });
      });
    } else {
      // Clone a single object (not a group)
      duplicatedObject = fabric.util.object.clone(selectedObject);
      duplicatedObject.set({
        fill: selectedObject.fill, // Explicitly set the fill color (to avoid shared reference)
        stroke: selectedObject.stroke, // Explicitly set the stroke color
      });
    }

    // Offset the duplicate slightly to prevent overlap with the original
    duplicatedObject.set({
      left: selectedObject.left + 10,
      top: selectedObject.top + 10,
    });

    // Add the duplicated object to the canvas
    canvas.add(duplicatedObject);

    // Optionally, make the duplicate the active object
    canvas.setActiveObject(duplicatedObject);

    canvas.renderAll();
    console.log('Object duplicated');
  }
}



///////pinch zoom start
//const htmlCanvas = document.querySelector('canvas'); // Get the real <canvas> element
const htmlCanvas = canvas.upperCanvasEl;



//htmlCanvas.addEventListener('click', () => alert('Canvas clicked'));


let initialDistance = null;
let initialZoom = canvas.getZoom();

function setActiveTool(toolName) {
      //const activeToolDiv = document.getElementById('activeTool');
      //activeToolDiv.textContent = 'Active Tool: ' + toolName;
    }

// Helper function to calculate distance between two fingers
function getDistance(touches) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}


// Add event listener to the slider



document.getElementById('opacitySlider').addEventListener('input', (event) => {
  opacityValue = event.target.value;
  const selectedObject = canvas.getActiveObject();

  if (selectedObject) {
    selectedObject.set({
      opacity: opacityValue
    });

    // Re-render the canvas to apply the change
    canvas.renderAll();
  }
});

/*
document.getElementById('widthSlider').addEventListener('input', (event) => {
  console.log(event.target.value);
  brushWidth = event.target.value;
  console.log(brushWidth);

  enableDrawing();
  const selectedObject = canvas.getActiveObject();

  if (selectedObject) {
    selectedObject.set({
      width: brushWidth
    });

    // Re-render the canvas to apply the change
    canvas.renderAll();
  }
}); */
console.log('upperCanvasEl:', canvas.upperCanvasEl);

if (!canvas.upperCanvasEl) {
  console.error('canvas.upperCanvasEl is missing!');
} else {
  console.log('canvas.upperCanvasEl is present and ready.');
}
// Set default opacity for the canvas objects
canvas.getObjects().forEach((obj) => {
  obj.set({ opacity: defaultOpacity });
});

htmlCanvas.addEventListener('touchstart', function (event) {
  if (event.touches.length === 2) {
    initialDistance = getDistance(event.touches);
    initialZoom = canvas.getZoom();
  }
}, { passive: false });

htmlCanvas.addEventListener('touchmove', function (event) {
  if (canvas.isDrawingMode) return; 
  if (event.touches.length === 2 && initialDistance) {
    event.preventDefault(); // prevent page from scrolling/zooming

    const newDistance = getDistance(event.touches);
    const zoomFactor = newDistance / initialDistance;

    const midX = (event.touches[0].pageX + event.touches[1].pageX) / 2;
    const midY = (event.touches[0].pageY + event.touches[1].pageY) / 2;
    const rect = htmlCanvas.getBoundingClientRect();
    const point = new fabric.Point(midX - rect.left, midY - rect.top);

    const newZoom = initialZoom * zoomFactor;
    canvas.zoomToPoint(point, Math.max(0.3, Math.min(3, newZoom)));
    canvas.freeDrawingBrush.width = brushWidth / canvas.getZoom();
    console.log(canvas.freeDrawingBrush.width)

  }
}, { passive: false });

htmlCanvas.addEventListener('touchend', function () {
  initialDistance = null;
  saveState();
});

function getDistance(touches) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}




function toggleToolMenu() {
  const menu = document.getElementById('toolMenu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
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
  const menu = document.getElementById('selectMenu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

function toggleSubmitMenu() {
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1.0
  });

  const img = document.getElementById('canvasPreview');
  img.src = dataURL;

  const menu = document.getElementById('submitMenu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  
}
makeDraggable(document.getElementById("selectMenu"));

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

/////////////// Pinch zoom end ///////////////

document.getElementById('shapesSubMenu').addEventListener('click', function(e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});
document.getElementById('submitMenu').addEventListener('click', function(e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});

let shape;
let x1;
let y1;
let x2; 
let y2;

let isDragging = false;
let lastPosX, lastPosY;

canvas.on('mouse:down', function(opt) {
  const evt = opt.e.touches ? opt.e.touches[0] : opt.e;
  console.log("mouse down");
  if (!canvas.getActiveObject() && !canvas.isDrawingMode) {
    isDragging = true;
    canvas.selection = false;
    lastPosX = evt.clientX;
    lastPosY = evt.clientY;
  }
});

canvas.on('mouse:move', function(opt) {
  if (isDragging) {
    
    const evt = opt.e.touches ? opt.e.touches[0] : opt.e;
    const deltaX = evt.clientX - lastPosX;
    const deltaY = evt.clientY - lastPosY;

    const vpt = canvas.viewportTransform;
    vpt[4] += deltaX;
    vpt[5] += deltaY;

    canvas.requestRenderAll();

    lastPosX = evt.clientX;
    lastPosY = evt.clientY;
    console.log("dragging");
  }
});

canvas.on('mouse:up', function() {
  isDragging = false;
  canvas.selection = true;
});


let radiiLines = []; // To keep track of lines so we can remove them

// Draw radii lines from centerX, centerY outward
function drawRadii(centerX, centerY, radius, count) {
  // Remove previous radii lines
  radiiLines.forEach(line => canvas.remove(line));
  radiiLines = [];

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - (Math.PI / 2);// -15;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const line = new fabric.Line([centerX, centerY, x, y], {
      stroke: '#DDDDDD',
      strokeWidth: 5,
      selectable: false,
      evented: false
    });

    radiiLines.push(line);
    canvas.add(line);
  }

  canvas.sendToBack(...radiiLines);
}


function resizeCanvas() {
  const newSize = Math.min(window.innerWidth - 20, window.innerHeight - 100);
  scaleCanvasObjectsToFit(newSize, newSize);
  maxRadius = newSize / 2.2;
  createTemplate(); // ← this updates and locks the template
  saveState();
}

    

    // Update the drawing color when the user picks a color
    function updateDrawingColor() {
      preview.style.backgroundColor = currentColor;
      const slider = document.getElementById('opacitySlider');
      opacityValue = slider.value;
    
      const selectedObject = canvas.getActiveObject();
      if (selectedObject) {
        if (selectedObject.type === 'line' || selectedObject.type === 'path') {
          selectedObject.set('stroke', currentColor);
        } else if (selectedObject.type === 'text') {
          selectedObject.set('fill', currentColor);
        } else {
          selectedObject.set('fill', currentColor);
        }
        canvas.renderAll();
      }
    
      // Only enable drawing if picker is not visible
      if (colorPickerContainer.style.display === 'none') {
        enableDrawing();
      }
    }
    

    // Function to zoom in
    function zoomIn() {
      const zoom = canvas.getZoom();
      canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, zoom + 0.1);
    }

// Function to zoom out
    function zoomOut() {
      const zoom = canvas.getZoom();
      canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, zoom - 0.1);
    }
 
    // Enable free drawing mode and set the color
    function enableDrawing() {
      console.log(fabric.version);
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = brushWidth / canvas.getZoom();
      canvas.freeDrawingBrush.color = currentColor;  // Set drawing color to the selected color
      canvas.freeDrawingBrush.opacity = opacityValue;
      pendingShapeType = null;  // Clear the pending shape
      //setActiveTool('Free Draw');

    }

    function enableEraser() {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
      canvas.freeDrawingBrush.width = brushWidth;
    }

    // Disable free drawing mode
    function disableDrawing() {
      canvas.isDrawingMode = false;
      pendingShapeType = null;  // Clear the pending shape
      //setActiveTool('Select/Move');
      console.log("drawing disabled");
      toggleToolMenu();
      toggleSelectMenu();
    }
/*
    // Save the canvas as an image
    function saveImage() {
      const dataURL = canvas.toDataURL({
        format: 'png'
      });
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'my-drawing.png';
      link.click();
      
    }
*/
    // Delete the selected object (turn it white and make it small)
    function deleteObject() {
       
      const activeObject = canvas.getActiveObject();
      /*if (selectedObject) {
        selectedObject.set({ fill: 'black', stroke: 'black', width: 1, height: 1,  top: -100, strokeWidth: 0});
        canvas.renderAll();
      }*/
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.discardActiveObject(); // Deselect the deleted object
        canvas.requestRenderAll();    // Redraw the canvas
      }
    }

    
    function createTemplate() {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      maxRadius = Math.min(canvas.width, canvas.height) / 2.2;
    
      // Remove ALL previous template objects or groups
      canvas.getObjects().forEach(obj => {
        if (obj.templateElement) canvas.remove(obj);
      });
    
      // Create rings
      const circles = [1, 0.75, 0.5, 0.25].map(factor => 
        new fabric.Circle({
          left: centerX - maxRadius * factor,
          top: centerY - maxRadius * factor,
          radius: maxRadius * factor,
          stroke: '#444',
          strokeWidth: 1,
          fill: 'transparent',
          selectable: false,
          evented: false
        })
      );
    
      // Create labels
      const label1 = new fabric.Text('3', {
        fontFamily: 'Arial, sans-serif',
        left: centerX - 25,
        top: centerY - maxRadius - 25,
        fontSize: 24,
        fill: '#AAAAAA',
        selectable: false,
        evented: false
      });
    
      const label2 = new fabric.Text('B', {
        fontFamily: 'Arial, sans-serif',
        left: centerX - maxRadius,
        top: centerY + maxRadius / 2,
        fontSize: 24,
        fill: '#AAAAAA',
        selectable: false,
        evented: false
      });
    
      const label3 = new fabric.Text('G', {
        fontFamily: 'Arial, sans-serif',
        left: centerX + maxRadius * 0.95,
        top: centerY + maxRadius / 2,
        fontSize: 24,
        fill: '#AAAAAA',
        selectable: false,
        evented: false
      });
    
      // Draw radii lines
      const radiiLines = [];
      for (let i = 0; i < newRadiiCount; i++) {
        const angle = (2 * Math.PI * i) / newRadiiCount - Math.PI / 2;
        const x = centerX + maxRadius * Math.cos(angle);
        const y = centerY + maxRadius * Math.sin(angle);
    
        radiiLines.push(new fabric.Line([centerX, centerY, x, y], {
          stroke: '#DDDDDD',
          strokeWidth: 2,
          selectable: false,
          evented: false
        }));
      }
    
      const templateObjects = [...circles, label1, label2, label3, ...radiiLines];
    
      // Mark all with templateElement = true
      templateObjects.forEach(obj => obj.templateElement = true);
    
      // Group and lock them
      const templateGroup = new fabric.Group(templateObjects, {
        selectable: false,
        evented: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true
      });
    
      // Mark group too, so it can be removed later
      templateGroup.templateElement = true;
    
      canvas.add(templateGroup);
      canvas.sendToBack(templateGroup);
    }
    
    
    // Adjust canvas size when the window is resized
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', function(event) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      deleteObject();
      }
      
    });

document.getElementById("radii-slider").addEventListener("input", function (event) {
  const newRadiiCount = parseInt(event.target.value, 10);
  const centerX = canvas.getWidth() / 2;
  const centerY = canvas.getHeight() / 2;
  drawRadii(centerX, centerY, maxRadius, newRadiiCount);
});

function resetCanvasView() {
  canvas.setZoom(initialZoom);
  canvas.setViewportTransform([...initialViewportTransform]);
  canvas.renderAll();
}

    // Initial resize
    resizeCanvas();
    let initialViewportTransform = [...canvas.viewportTransform]; // clone it

    enableDrawing();
   
function fitCanvasToObjects() {
  const objects = canvas.getObjects().filter(obj => !obj.templateElement); // Skip template elements
  if (objects.length === 0) return;

  // Calculate bounding box of all objects
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  objects.forEach(obj => {
    const bounds = obj.getBoundingRect(true); // true = include transformations
    minX = Math.min(minX, bounds.left);
    minY = Math.min(minY, bounds.top);
    maxX = Math.max(maxX, bounds.left + bounds.width);
    maxY = Math.max(maxY, bounds.top + bounds.height);
  });

  const boundsWidth = maxX - minX;
  const boundsHeight = maxY - minY;

  const padding = 40;
  const scaleX = (canvas.getWidth() - padding * 2) / boundsWidth;
  const scaleY = (canvas.getHeight() - padding * 2) / boundsHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don’t zoom in more than 100%

  canvas.setZoom(scale);

  const vpt = canvas.viewportTransform;

  // Center objects in the canvas
  vpt[4] = canvas.getWidth() / 2 - (minX + boundsWidth / 2) * scale;
  vpt[5] = canvas.getHeight() / 2 - (minY + boundsHeight / 2) * scale;

  canvas.setViewportTransform(vpt);
  canvas.renderAll();
}

    
function updateCanvasPreview() {
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1.0
  });

  const previewImg = document.getElementById('canvasPreview');
  previewImg.src = dataURL;
}

  

document.getElementById('submissionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  //fitCanvasToObjects();
  //resetCanvasView();
  const title = document.getElementById('title').value;
  const name = document.getElementById('name').value;
  const altText = document.getElementById('altText').value;
  const description = document.getElementById('description').value;
  const axis3 = document.getElementById('axis3').value;
  const axisB = document.getElementById('axisB').value;
  const axisG = document.getElementById('axisG').value;
  const pronouns = document.getElementById('pronouns').value;
  const base64 = canvas.toDataURL('image/png');


  // 1. Get checked checkbox values
  const selectedOptions = Array.from(document.querySelectorAll('input[name="options"]:checked'))
    .map(input => input.value);

  // 2. Get non-empty custom inputs
  const customInputs = Array.from(document.querySelectorAll('#customOptionsContainer input'))
    .map(input => input.value.trim())
    .filter(val => val.length > 0);

    const allChoices = [...selectedOptions, ...customInputs]
    .map(str => str.trim())
    .filter(str => str.length > 0);
    const tagsString = allChoices.join(", "); // e.g., "Option 1, Custom input"
    const combinedTags = Array.from(new Set([...allChoices, ...selectedTags])).join(', ');
    //frameworks 
    // Get selected predefined frameworks from checkboxes
  // Clear old map
selectedFrameworksMap.clear();

// Add selected frameworks from submit list
document.querySelectorAll('#frameworkSubmitList input[type=checkbox]:checked').forEach(cb => {
  const id = cb.value;
  const def = cb.nextElementSibling?.tagName === 'SMALL'
    ? cb.nextElementSibling.textContent.trim()
    : '';
  selectedFrameworksMap.set(id, def);
});

// Add custom framework if entered
const customName = document.getElementById('customFrameworkName').value.trim();
const customDef = document.getElementById('customFrameworkDefinition').value.trim();
if (customName) {
  selectedFrameworksMap.set(customName, customDef);
}

// Now serialize
const frameworkObj = Object.fromEntries(selectedFrameworksMap);
const frameworksJSON = JSON.stringify(frameworkObj);

  toggleSubmitMenu();
  const payload = {
    title,
    name,
    pronouns,
    imageBase64: base64,
    altText,
    ax3: axis3,
    axisB,
    axisG,
    tags: combinedTags, // comma-separated string
    description,
    frameworks: frameworksJSON,
  };
  
  console.log('Payload:', payload);

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

let knownTags = ["stud", "transfeminine", "doll", "cis", "it", "trans", "enby", "amab", "afab", "two spirit"];
console.error('pre fetch');

fetch('/.netlify/functions/get-tags')
  .then(res => res.json())
  .then(data => {
    console.error('in  tagging');
    const combined = [...new Set(knownTags.concat(data.tags))].sort();
    knownTags = combined;
    console.log('Loaded tags from Airtable:', knownTags); // ← move your log here
    setupTagSearchForForm();
    setupShowAllTagsButtonForForm(); // ← add this too

    renderAllTagsList(); // ← show tags immediately

  })
  .catch(err => {
    console.error('Failed to load tag suggestions:', err);
    setupTagSearchForForm();
    setupShowAllTagsButtonForForm(); // ← add this too

    renderAllTagsList(); // ← show tags immediately
  });

  


function setupTagSearchForForm() {
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');
  const selectedTagsDiv = document.getElementById('selectedTags');
  const hiddenInput = document.getElementById('selectedTagsInput');

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';

    if (!query) return;

    const matching = Array.from(allTags).filter(tag =>
      tag.startsWith(query) && !selectedTags.has(tag)
    );

    matching.forEach(tag => {
      const div = document.createElement('div');
      div.textContent = tag;
      div.className = 'tag-suggestion';
      div.addEventListener('click', () => {
        selectedTags.add(tag);
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTagsUI();
      });
      suggestions.appendChild(div);
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (val && !selectedTags.has(val)) {
        selectedTags.add(val);
        allTags.add(val); // Let new tags in!
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTagsUI();
      }
    }
  });

  function updateSelectedTagsUI() {
    selectedTagsDiv.innerHTML = '';
    selectedTags.forEach(tag => {
      const tagElem = document.createElement('span');
      tagElem.className = 'selected-tag';
      tagElem.textContent = tag;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.className = 'remove-tag-btn';
      removeBtn.addEventListener('click', () => {
        selectedTags.delete(tag);
        updateSelectedTagsUI();
      });

      tagElem.appendChild(removeBtn);
      selectedTagsDiv.appendChild(tagElem);
    });

    hiddenInput.value = Array.from(selectedTags).join(', ');
  }
}

function renderAllTagsList() {
  const allTagsList = document.getElementById('allTagsList');
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');

  allTagsList.style.display = 'block';
  allTagsList.innerHTML = '';

  const selected = new Set(
    Array.from(document.querySelectorAll('#selectedTags .selected-tag')).map(
      span => span.textContent.replace('×', '').trim().toLowerCase()
    )
  );

  Array.from(allTags).sort().forEach(tag => {
    if (selected.has(tag)) return;

    const div = document.createElement('div');
    div.textContent = tag;
    div.classList.add('tag-suggestion');
    div.style.cursor = 'pointer';
    div.style.padding = '4px 8px';

    div.addEventListener('click', () => {
      selectedTags.add(tag);
      updateSelectedTagsUI();
      input.value = '';
      suggestions.innerHTML = '';
      renderAllTagsList(); // Re-render to reflect new selection
    });

    allTagsList.appendChild(div);
  });
}

function setupShowAllTagsButtonForForm() {
  renderAllTagsList();
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('/.netlify/functions/get-tags')
    .then(res => res.json())
    .then(data => {
      const combined = [...new Set(knownTags.concat(data.tags))].sort();
      combined.forEach(tag => allTags.add(tag.toLowerCase()));
      setupTagSearchForForm();
      renderAllTagsList(); // show immediately
    })
    .catch(err => {
      console.error('Failed to load tag suggestions:', err);
      knownTags.forEach(tag => allTags.add(tag.toLowerCase()));
      setupTagSearchForForm();
      renderAllTagsList(); // show fallback tags
    });
});

function setupTagSearchForForm() {
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    suggestions.innerHTML = '';

    if (!query) return;

    const matching = Array.from(allTags).filter(tag =>
      tag.startsWith(query) && !selectedTags.has(tag)
    );

    matching.forEach(tag => {
      const div = document.createElement('div');
      div.textContent = tag;
      div.className = 'tag-suggestion';
      div.style.cursor = 'pointer';
      div.style.padding = '4px 8px';
      div.addEventListener('click', () => {
        selectedTags.add(tag);
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTagsUI();
        renderAllTagsList(); // update list
      });
      suggestions.appendChild(div);
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (val && !selectedTags.has(val)) {
        selectedTags.add(val);
        allTags.add(val);
        input.value = '';
        suggestions.innerHTML = '';
        updateSelectedTagsUI();
        renderAllTagsList();
      }
    }
  });
}

function updateSelectedTagsUI() {
  const selectedTagsDiv = document.getElementById('selectedTags');
  const hiddenInput = document.getElementById('selectedTagsInput');

  selectedTagsDiv.innerHTML = '';
  selectedTags.forEach(tag => {
    const tagElem = document.createElement('span');
    tagElem.className = 'selected-tag';
    tagElem.textContent = tag;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-tag-btn';
    removeBtn.style.marginLeft = '6px';
    removeBtn.addEventListener('click', () => {
      selectedTags.delete(tag);
      updateSelectedTagsUI();
      renderAllTagsList(); // re-render when tag removed
    });

    tagElem.appendChild(removeBtn);
    tagElem.style.marginRight = '8px';
    tagElem.style.display = 'inline-block';
    tagElem.style.padding = '4px 8px';
    tagElem.style.background = '#ddd';
    tagElem.style.borderRadius = '12px';

    selectedTagsDiv.appendChild(tagElem);
  });

  hiddenInput.value = Array.from(selectedTags).join(', ');
}

function renderAllTagsList() {
  const allTagsList = document.getElementById('allTagsList');
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');

  allTagsList.innerHTML = '';

  const selected = new Set(selectedTags);

  Array.from(allTags).sort().forEach(tag => {
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
      selectedTags.add(tag);
      updateSelectedTagsUI();
      input.value = '';
      suggestions.innerHTML = '';
      renderAllTagsList();
    });

    allTagsList.appendChild(div);
  });
}
function toggleHiddenInputs() {
  const hiddenInputsDiv = document.getElementById('hidden-inputs');
  const currentDisplay = window.getComputedStyle(hiddenInputsDiv).display;

  if (currentDisplay === 'none') {
    hiddenInputsDiv.style.display = 'block';
  } else {
    hiddenInputsDiv.style.display = 'none';
  }
}
/////////////////////////////////////////////////

const frameworkOptions = [
  { id: 'innate', label: 'innate', definition: 'or internal. gender rooted in a deep sense of self' },
  { id: 'external', label: 'external', definition: 'gender is expressed outwardly through presentation and impacted by perception' },
  { id: 'situational', label: 'situational', definition: 'gender is impacted by the specific environment or situation' }, 
  { id: 'socially conditioned', label: 'socially conditioned', definition: 'gender is taught through social factors' }, 
  { id: 'spiritual', label: 'spiritual', definition: 'gender is connected with a higher power, nature or other spiritual beliefs' },
  { id: 'none', label: 'none', definition: 'no strong gender beliefs' }
];
//conditioned: how you are taught to act by social factors
//situation: how you present based on your surroundings

const selectedFrameworksMap = new Map(); // key: id or custom name, value: definition

document.addEventListener('DOMContentLoaded', () => {
  renderFrameworkList();

  const modal = document.getElementById('startupModal');
  //modal.style.display = 'flex';

  document.getElementById('closeModalBtn').addEventListener('click', () => {
    // Collect checked frameworks from modal checkboxes
    document.querySelectorAll('#frameworkList input[type="checkbox"]').forEach(cb => {
      if (cb.checked) {
        const id = cb.value;
        const opt = frameworkOptions.find(o => o.id === id);
        selectedFrameworksMap.set(id, opt ? opt.definition || '' : '');
      } else {
        selectedFrameworksMap.delete(cb.value);
      }
    });
  
    // Add custom framework
    const customName = document.getElementById('customFrameworkName').value.trim();
    const customDef = document.getElementById('customFrameworkDefinition').value.trim();
    if (customName) {
      selectedFrameworksMap.set(customName, customDef);
    }
  
    // Hide modal
    modal.style.display = 'none';
  
    // Now update submit list with current selections
    renderFrameworkSubmitList();
  });
  
});

function renderFrameworkList() {
  const container = document.getElementById('frameworkList');
  container.innerHTML = ''; // Clear previous

  frameworkOptions.forEach(opt => {
    const label = document.createElement('label');
    label.className = 'framework-item-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = opt.id;
    checkbox.checked = selectedFrameworksMap.has(opt.id);

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedFrameworksMap.set(opt.id, opt.definition || '');
      } else {
        selectedFrameworksMap.delete(opt.id);
      }
    });

    label.appendChild(checkbox);

    const labelText = document.createTextNode(' ' + opt.label + ' ');
    label.appendChild(labelText);

    if (opt.definition) {
      const defSpan = document.createElement('small');
      defSpan.className = 'framework-definition';
      defSpan.textContent = opt.definition;
      label.appendChild(defSpan);
    }
    container.appendChild(label);
  });
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


function renderFrameworkSubmitList() {
  const container = document.getElementById('frameworkSubmitList');
  container.innerHTML = ''; // Clear old list

  // Create a Set of all default ids for quick lookup
  const defaultIds = new Set(frameworkOptions.map(opt => opt.id));

  // Render predefined frameworks
  frameworkOptions.forEach(opt => {
    createFrameworkCheckbox(container, opt.id, opt.label, opt.definition);
  });

  // Render custom frameworks (in selectedFrameworksMap but not in defaultIds)
  selectedFrameworksMap.forEach((definition, key) => {
    if (!defaultIds.has(key)) {
      // For custom, use key as label, definition from map
      createFrameworkCheckbox(container, key, key, definition);
    }
  });
}

// Helper function to create each checkbox + label and attach event listener
function createFrameworkCheckbox(container, id, labelText, definition) {
  const label = document.createElement('label');
  label.className = 'framework-item-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = id;
  checkbox.checked = selectedFrameworksMap.has(id);

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selectedFrameworksMap.set(id, definition || '');
    } else {
      selectedFrameworksMap.delete(id);
    }
  });

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(' ' + labelText + ' '));

  if (definition) {
    const defSpan = document.createElement('small');
    defSpan.className = 'framework-definition';
    defSpan.textContent = definition;
    label.appendChild(defSpan);
  }

  container.appendChild(label);
}


