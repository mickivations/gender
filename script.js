
  // Create canvas
  const canvas = new fabric.Canvas('c');
  const allTags = new Set();
const selectedTags = new Set();
canvas.setBackgroundColor('#000000', canvas.renderAll.bind(canvas));

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


let currentColor = '#ffff00';  // Default color is yellow

// Set up the default opacity to 0.8
let opacityValue = 0.8;
let pendingShapeType = null;
let brushWidth = 7;

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
console.log(fabric.EraserBrush); // Should NOT be undefined


function saveState() {
  if (isRestoringState) return; // prevent saving during undo/redo
  redoStack.length = 0; // clear redo stack on new action
  undoStack.push(JSON.stringify(canvas));
}

function undo() {
  if (undoStack.length > 1) {
    isRestoringState = true;
    const current = undoStack.pop();
    redoStack.push(current);
    const previous = undoStack[undoStack.length - 1];
    canvas.loadFromJSON(previous, () => {
      canvas.renderAll();
      isRestoringState = false;
    });
  }
}

function redo() {
  if (redoStack.length > 0) {
    isRestoringState = true;
    const state = redoStack.pop();
    undoStack.push(state);
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      isRestoringState = false;
    });
  }
}

// Save initial blank state
canvas.on('after:render', () => {
  if (undoStack.length === 0) saveState();
});

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
const htmlCanvas = document.querySelector('canvas');



htmlCanvas.addEventListener('click', () => alert('Canvas clicked'));


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

// Set default opacity for the canvas objects
canvas.getObjects().forEach((obj) => {
  obj.set({ opacity: defaultOpacity });
});


function getDistance(touches) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

htmlCanvas.addEventListener('touchstart', function(event) {
  if (event.touches.length === 2) {
    initialDistance = getDistance(event.touches);
    initialZoom = canvas.getZoom();
  }
});

htmlCanvas.addEventListener('touchmove', function(event) {
  if (event.touches.length === 2 && initialDistance) {
    event.preventDefault(); // stop page zoom
    const newDistance = getDistance(event.touches);
    const zoomFactor = newDistance / initialDistance;

    // Get midpoint of the gesture
    const midX = (event.touches[0].pageX + event.touches[1].pageX) / 2;
    const midY = (event.touches[0].pageY + event.touches[1].pageY) / 2;
    const rect = canvas.upperCanvasEl.getBoundingClientRect();
    const point = new fabric.Point(midX - rect.left, midY - rect.top);

    canvas.zoomToPoint(point, initialZoom * zoomFactor);
  }
}, { passive: false });

htmlCanvas.addEventListener('touchend', function() {
  initialDistance = null;
});
 

function toggleSliderMenu() {
  const menu = document.getElementById('sliderMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
function toggleShapesMenu() {
  const menu = document.getElementById('shapesSubMenu');
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
  }
});

canvas.on('mouse:up', function() {
  isDragging = false;
  canvas.selection = true;
});



/*
canvas.on('mouse:down', function(event) {
    if (!pendingShapeType) return;  // If no shape is pending, do nothing
  
    // Check if an object was clicked
    if (event.target) {
      // An object was clicked, select it
      canvas.setActiveObject(event.target);
      console.log('Clicked on an object:', event.target.type);
      return; // Don't add a new shape
    }
  
    // No object clicked, so we can add a new shape
    const pointer = canvas.getPointer(event.e);
    x1 = pointer.x;
    y1 = pointer.y;
    


  });*/

/*
  canvas.on('mouse:up', function(event) {

    if (!pendingShapeType) return;  // If no shape is pending, do nothing
/  - *
    // Check if an object was clicked
    if (event.target) {
      // An object was clicked, select it
      canvas.setActiveObject(event.target);
      console.log('Clicked on an object:', event.target.type);
      return; // Don't add a new shape
    }
* -/
    const pointer = canvas.getPointer(event.e);
    x2 = pointer.x;
    y2 = pointer.y;
    switch (pendingShapeType) {
      case 'rect':
        setActiveTool('Rectangle');
        shape = new fabric.Rect({
          fill: currentColor,
          left: x1,
          top: y1,
          width: x2- x1,
          height: y2 - y1,
          angle: 0,
          opacity: opacityValue
        });
        break;
      case 'circle':
        setActiveTool('Circle');
        shape = new fabric.Ellipse({
          left: x1,
          top: y1,
          fill: currentColor,
          //width: x2- x1,
          rx: Math.abs(x2 - x1)/2, //Math.sqrt(((y2 - y1)/2*(y2 - y1)/2) + ((x2 - x1)/2*(x2 - x1)/2)),
          ry: Math.abs(y2 - y1)/2,
          opacity: opacityValue
        });
        break;
      case 'line':
        setActiveTool('Line');
        shape = new fabric.Line([x1, y1, x2, y2], {
          stroke: currentColor,
          strokeWidth: brushWidth,
          selectable: true,
          opacity: opacityValue
        });
        break;
      case 'triangle':
        setActiveTool('Triangle');
        shape = new fabric.Triangle({
          left: x1,
          top: y1,
          width: x2- x1,
          height: y2 - y1,
          fill: currentColor,
          selectable: true,
         opacity: opacityValue
        }); 
        break;
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }); */

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
}

    

    // Update the drawing color when the user picks a color
    function updateDrawingColor() {
  currentColor = document.getElementById('colorPicker').value;
  console.log('Current color selected:', currentColor);

  const selectedObject = canvas.getActiveObject();
  if (selectedObject) {
    if (selectedObject.type === 'line') {
      selectedObject.set('stroke', currentColor);
    } else if (selectedObject.type === 'text') {
      selectedObject.set('fill', currentColor);
    } else {
      selectedObject.set('fill', currentColor);
    }
    canvas.renderAll();
  }
  enableDrawing()
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
      canvas.freeDrawingBrush.width = brushWidth;
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
      setActiveTool('Select/Move');
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
      const selectedObject = canvas.getActiveObject();
      if (selectedObject) {
        selectedObject.set({ fill: 'black', stroke: 'black', width: 1, height: 1,  top: -100, strokeWidth: 0});
        canvas.renderAll();
      }
    }

    
    function createTemplate() {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
    
      canvas.setBackgroundColor('#000000', canvas.renderAll.bind(canvas));
      maxRadius = Math.min(canvas.width, canvas.height) / 2.2;
    
      // Remove existing template elements
      canvas.getObjects().forEach(obj => {
        if (obj.templateElement) {
          canvas.remove(obj);
        }
      });
    
      // Create circles
      const circle1 = new fabric.Circle({
        left: centerX - maxRadius,
        top: centerY - maxRadius,
        radius: maxRadius,
        stroke: '#AAAAAA',
        strokeWidth: 1,
        fill: 'transparent',
        selectable: false,
        evented: false
      });
    
      const circle2 = new fabric.Circle({
        left: centerX - maxRadius * 0.75,
        top: centerY - maxRadius * 0.75,
        radius: maxRadius * 0.75,
        stroke: '#AAAAAA',
        strokeWidth: 1,
        fill: 'transparent',
        selectable: false,
        evented: false
      });
    
      const circle3 = new fabric.Circle({
        left: centerX - maxRadius * 0.5,
        top: centerY - maxRadius * 0.5,
        radius: maxRadius * 0.5,
        stroke: '#AAAAAA',
        strokeWidth: 1,
        fill: 'transparent',
        selectable: false,
        evented: false
      });
    
      const circle4 = new fabric.Circle({
        left: centerX - maxRadius * 0.25,
        top: centerY - maxRadius * 0.25,
        radius: maxRadius * 0.25,
        stroke: '#AAAAAA',
        strokeWidth: 1,
        fill: 'transparent',
        selectable: false,
        evented: false
      });
    
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
        left: centerX + maxRadius *.95,
        top: centerY + maxRadius / 2,
        fontSize: 24,
        fill: '#AAAAAA',
        selectable: false,
        evented: false
      });
    
      // Draw radii lines
      const radiiCount = newRadiiCount; // from your global or slider input
      const radiiLines = [];
      for (let i = 0; i < radiiCount; i++) {
        const angle = (2 * Math.PI * i) / radiiCount - Math.PI / 2;
        const x = centerX + maxRadius * Math.cos(angle);
        const y = centerY + maxRadius * Math.sin(angle);
    
        const line = new fabric.Line([centerX, centerY, x, y], {
          stroke: '#DDDDDD',
          strokeWidth: 2,
          selectable: false,
          evented: false
        });
    
        radiiLines.push(line);
      }
    
      // Tag all template objects for easy removal later
      const templateElements = [circle1, circle2, circle3, circle4, label1, label2, label3, ...radiiLines];
      templateElements.forEach(obj => obj.templateElement = true);
    
      // Group and lock them
      const templateGroup = new fabric.Group(templateElements, {
        selectable: false,
        evented: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true
      });
    
      // Add and send to back
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

    // Initial resize
    resizeCanvas();
    enableDrawing();

  

document.getElementById('submissionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const name = document.getElementById('name').value;
  const altText = document.getElementById('altText').value;
  const description = document.getElementById('description').value;
  const axis3 = document.getElementById('axis3').value;
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
    
    

  toggleSubmitMenu();
  const payload = {
    title,
    name,
    pronouns,
    imageBase64: base64,
    altText,
    ax3: axis3,
    tags: combinedTags, // comma-separated string
    description,
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

let knownTags = ["stud", "transfemme", "transmasc", "xenogender", "dyke", "cis", "it", "trans"];
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

  


/*
function handleSubmit() {
  const imageData = canvas.toDataURL({
    format: 'png',
    quality: 0.9
  });

  fetch('https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/dispatches', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_GITHUB_PAT',
      'Accept': 'application/vnd.github.everest-preview+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_type: 'submit_data',
      client_payload: {
        imageData: imageData,
        timestamp: new Date().toISOString()
      }
    })
  })
  .then(res => {
    if (res.ok) {
      alert('Submitted!');
    } else {
      alert('Submission failed.');
      res.text().then(console.error);
    }
  });
}*/

//// form script 
/*
const maxCustomOptions = 20;
  const container = document.getElementById('customOptionsContainer');
  const addButton = document.getElementById('addCustomOption');

  let customOptionCount = 0;
*/
 /* addButton.addEventListener('click', () => {
    if (customOptionCount < maxCustomOptions) {
      customOptionCount++;

      const input = document.createElement('input');
      input.type = 'text';
      input.name = `customOption${customOptionCount}`;
      input.placeholder = `Other ${customOptionCount}`;
      input.maxLength = 100;
      input.style.marginTop = '0.5rem';

      container.appendChild(input);
    }

    if (customOptionCount === maxCustomOptions) {
      addButton.disabled = true;
      addButton.textContent = 'Limit reached';
    }
  });
    
// Function to add editable text
function addText(event) {

  // Create the editable text object
  const text = new fabric.Textbox('Click to edit', {
    left: 20,
    top: 20,
    fontSize: 30,
    fill: currentColor,
    editable: true,
    hasBorders: true,
    hasControls: true,
    lockUniScaling: true,
    opacity: opacityValue
  });

  // Add the text to the canvas
  canvas.add(text);
  canvas.setActiveObject(text); // Automatically select the new text object
  canvas.renderAll();
}

const shapesButton = document.getElementById('shapesButton');
const shapesSubMenu = document.getElementById('shapesSubMenu');

let isDragging = false;
let lastPosX = 0;
let lastPosY = 0;

// Enable pan on mouse or touch drag
canvas.on('mouse:down', function(opt) {
  const evt = opt.e.touches ? opt.e.touches[0] : opt.e;

  // Only start panning if no object is selected and not drawing
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
  }
});

canvas.on('mouse:up', function() {
  isDragging = false;
  canvas.selection = true;
});


/*
// Toggle submenu on button click
shapesButton.addEventListener('click', () => {
  shapesSubMenu.style.display = shapesSubMenu.style.display === 'none' ? 'block' : 'none';
});

*/
/*
// Optional: Hide submenu when clicking outside
document.addEventListener('click', (event) => {
  if (!event.target.closest('.menu')) {
    shapesSubMenu.style.display = 'none';
  }
});
/*
document.getElementById("radii-slider").addEventListener("input", function (event) {
  const newRadiiCount = parseInt(event.target.value, 10);
  drawRadii(radiiGroup, centerX, centerY, radius, newRadiiCount);
});*/

/*
function createRectangle(x, y) {
    return new fabric.Rect({
      left: x,
      top: y,
      width: 1,
      height: 1,
      stroke: '#5BCEFA',
      strokeWidth: 2,
      selectable: true,
    });
  }
  
  function createCircle(x, y) {
    return new fabric.Circle({
      left: x,
      top: y,
      radius: 1,
      fill: 'rgba(245,169,184,0.4)',
      stroke: '#F5A9B8',
      strokeWidth: 2,
      selectable: true,
    });
  }
  
  function createLine(x, y) {
    return new fabric.Line([x, y, x, y], {
      stroke: '#5BCEFA',
      strokeWidth: 2,
      selectable: true,
    });
  }
*/

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
  /*
  const showAllTagsBtn = document.getElementById('showAllTagsBtn');
  const allTagsList = document.getElementById('allTagsList');
  const input = document.getElementById('tagSearch');
  const suggestions = document.getElementById('tagSuggestions');

  showAllTagsBtn.addEventListener('click', () => {
    if (allTagsList.style.display === 'none' || allTagsList.style.display === '') {
      // Show and populate the list
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
          allTagsList.style.display = 'none';
          input.value = '';
          suggestions.innerHTML = '';
        });

        allTagsList.appendChild(div);
        allTagsList.style.display = 'block';
      });
    } else {
      allTagsList.style.display = 'none';
    }
      
  }); */
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

window.addEventListener('DOMContentLoaded', () => {
  const picker = document.getElementById('colorPicker');
  picker.value = '#ffff00'; // or whatever color you prefer
});