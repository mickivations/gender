
//require('dotenv').config();
const canvas = new fabric.Canvas('c');
    let currentColor = '#ffff00';  // Default color is blue

// Set up the default opacity to 0.8
let opacityValue = 0.8;
let pendingShapeType = null;

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
const htmlCanvas = document.querySelector('canvas'); // Get the real <canvas> element
let initialDistance = null;
let initialZoom = canvas.getZoom();

function setActiveTool(toolName) {
      const activeToolDiv = document.getElementById('activeTool');
      activeToolDiv.textContent = 'Active Tool: ' + toolName;
    }

// Helper function to calculate distance between two fingers
function getDistance(touches) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Listen for touchstart
htmlCanvas.addEventListener('touchstart', function(event) {
  if (event.touches.length === 2) {
    initialDistance = getDistance(event.touches);
    initialZoom = canvas.getZoom();
  }
});

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

// Set default opacity for the canvas objects
canvas.getObjects().forEach((obj) => {
  obj.set({ opacity: defaultOpacity });
});


// Listen for touchmove
htmlCanvas.addEventListener('touchmove', function(event) {
  if (event.touches.length === 2 && initialDistance) {
    event.preventDefault(); // Important! Prevent page zoom
    const newDistance = getDistance(event.touches);
    const zoomFactor = newDistance / initialDistance;
    canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, initialZoom * zoomFactor);
  }
}, { passive: false }); // passive: false lets you call preventDefault()

// Listen for touchend
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
  const menu = document.getElementById('submitMenu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}
/////////////// Pinch zoom end ///////////////

document.getElementById('shapesSubMenu').addEventListener('click', function(e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});

let shape;
let x1;
let y1;
let x2; 
let y2;

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
    


  });


  canvas.on('mouse:up', function(event) {

    if (!pendingShapeType) return;  // If no shape is pending, do nothing
/*
    // Check if an object was clicked
    if (event.target) {
      // An object was clicked, select it
      canvas.setActiveObject(event.target);
      console.log('Clicked on an object:', event.target.type);
      return; // Don't add a new shape
    }
*/
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
          strokeWidth: 8,
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


    // Function to resize the canvas based on the window size
    function resizeCanvas() {
      canvas.setWidth(window.innerWidth - 20);  // 20px for margin
      canvas.setHeight(window.innerHeight - 100); // Adjust height for header and buttons
      canvas.renderAll();
      createTemplate();  // Re-create the template when the canvas resizes
    //  const newRadiiCount = parseInt(event.target.value, 10);
  const centerX = canvas.getWidth() / 2;
  const centerY = canvas.getHeight() / 2;
  drawRadii(centerX, centerY, maxRadius, newRadiiCount);
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
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = currentColor;  // Set drawing color to the selected color
      pendingShapeType = null;  // Clear the pending shape
      //setActiveTool('Free Draw');

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
    function saveImage() {
      const canvas = document.querySelector('canvas');
      const image = canvas.toDataURL('image/png');
    
      const user = prompt("Enter your name:");
      const notes = prompt("Any notes about your drawing?");
      const filename = `drawing_${Date.now()}`;
    
      const payload = {
       // image: image,
       // filename: filename,
        user: user,
        notes: notes
      };
      
    // https://script.google.com/macros/s/AKfycbwZHhWPnTCr37hJoERwTqA4F9i7dgWgpBcxO9mzBhdDwuuUZfg9pj_RGP-tPnbz1QJ3/exec\
    //https://script.google.com/macros/s/AKfycbwZHhWPnTCr37hJoERwTqA4F9i7dgWgpBcxO9mzBhdDwuuUZfg9pj_RGP-tPnbz1QJ3/exec
    fetch('https://script.google.com/macros/s/AKfycbwZHhWPnTCr37hJoERwTqA4F9i7dgWgpBcxO9mzBhdDwuuUZfg9pj_RGP-tPnbz1QJ3/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: "Test User",
        notes: "Uploaded from frontend",
        filename: "test_image",
        image: "data:image/png;base64,iVBORw0..." // your image data
      })
    })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));
  }

    // Delete the selected object (turn it white and make it small)
    function deleteObject() {
      const selectedObject = canvas.getActiveObject();
      if (selectedObject) {
        selectedObject.set({ fill: 'white', stroke: 'white', width: 1, height: 1, top: -100 });
        canvas.renderAll();
      }
    }

    
    // Create a "background" layer with axis lines and circle outlines
    function createTemplate() {
      // Recalculate the center of the canvas based on the current size
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // recalculate the maximum possible radius for the circles
       maxRadius = Math.min(canvas.width, canvas.height) / 2.2;

      // Remove any existing axis lines, circles, or text objects (misplaced or duplicates)
      canvas.getObjects().forEach(function(obj) {
        if (obj.selectable === false || obj.type === 'text' || obj.type === 'circle') {
          canvas.remove(obj); // Remove axis lines, text, and circles
        }
      });

      // Axis 1: Vertical line (center of the canvas) - stops at the max radius
   /*   const axis1 = new fabric.Line([centerX, centerY, centerX, centerY - maxRadius], {
        stroke: '#000000',
        strokeWidth: 10,
        selectable: false,
        evented: false
      });

      // Axis 2: Bottom-left diagonal line - stops at the max radius
      const axis2 = new fabric.Line([centerX+5, centerY-2, centerX + maxRadius+5, centerY-2], {
        stroke: '#000000',
        strokeWidth: 10,
        selectable: false,
        evented: false
      });
     axis2.set({ angle: 30});

      // Axis 3: Bottom-right diagonal line - stops at the max radius
      const axis3 = new fabric.Line([centerX+5, centerY+8, centerX + maxRadius+5, centerY+8], {
        stroke: '#000000',
        strokeWidth: 10,
        selectable: false,
        evented: false
      });
      axis3.set({ angle: 150});

*/
      // Add text to the template
      const label1 = new fabric.Text('3', {
        left: centerX -25,  // Adjust text to be centered horizontally
        top: centerY - maxRadius -25,   // Adjust text to be placed above the center
        fontSize: 24,
        fill: '#AAAAAA',
        selectable: true   // Make the text selectable to allow interaction
      });

      // Add text to the template
      const label2 = new fabric.Text('B', {
        left: centerX - maxRadius,  // Adjust text to be centered horizontally
        top: centerY + maxRadius/2,   // Adjust text to be placed above the center
        fontSize: 24,
        fill: '#AAAAAA',
        selectable: true   // Make the text selectable to allow interaction
      });

      // Add text to the template
      const label3 = new fabric.Text('G', {
        left: centerX + maxRadius,  // Adjust text to be centered horizontally
        top: centerY + maxRadius/2,   // Adjust text to be placed above the center
        fontSize: 24,
        fill: '#AAAAAA',
        selectable: true   // Make the text selectable to allow interaction
      });
/*
      // Add center dot
      const centerDot = new fabric.Circle({
        left: centerX,  // Adjust the center of the circle to the center of the canvas
        top: centerY-4,  // Adjust the center of the circle to the center of the canvas
        radius: 1,
        fill: '#FFFFFF',
        selectable: false,  // Make it unselectable
      });
*/
      // Add circle outlines radiating outward from the center
      const circle1 = new fabric.Circle({
        left: centerX - maxRadius,  // Position relative to center
        top: centerY - maxRadius,   // Position relative to center
        radius: maxRadius,
        stroke: '#AAAAAA',
        strokeWidth: 3,
        fill: 'transparent',
        selectable: false,
        evented: false
      });

      const circle2 = new fabric.Circle({
        left: centerX - maxRadius * 0.75,
        top: centerY - maxRadius * 0.75,
        radius: maxRadius * 0.75,
        stroke: '#AAAAAA',
        strokeWidth: 3,
        fill: 'transparent',
        selectable: false,
        evented: false
      });

      const circle3 = new fabric.Circle({
        left: centerX - maxRadius * 0.5,
        top: centerY - maxRadius * 0.5,
        radius: maxRadius * 0.5,
        stroke: '#AAAAAA',
        strokeWidth: 3,
        fill: 'transparent',
        selectable: false,
        evented: false
      });

      const circle4 = new fabric.Circle({
        left: centerX - maxRadius * 0.25,
        top: centerY - maxRadius * 0.25,
        radius: maxRadius * 0.25,
        stroke: '#AAAAAA',
        strokeWidth: 3,
        fill: 'transparent',
        selectable: false,
        evented: false
      });

      // Add the elements to the canvas
      canvas.add(circle1, circle2, circle3, circle4,  label1, label2, label3); //axis1, axis2, axis3,
      canvas.sendToBack(circle1);
      canvas.sendToBack(circle2);
      canvas.sendToBack(circle3);
      
    }

    // Call the template creator immediately
    createTemplate();

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


function createRectangle(x, y) {
    return new fabric.Rect({
      left: x,
      top: y,
      width: 1,
      height: 1,
      fill: 'rgba(91,206,250,0.4)',
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

    // Initial resize
    resizeCanvas();
    enableDrawing();

   

//airtable
// //patrgI0a9jrqSYQFl.0aeb268d8112aadea5cc60363ecc57994754d7d2b3a6dc71cdee307f23d9cfff

//imgbb
//d449e7eb6eddc18900a3521f89f418bc

// Replace these with your actual API keys
/*
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;  // Securely access the secret
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
*/

const IMGBB_API_KEY = 'd449e7eb6eddc18900a3521f89f418bc';
const AIRTABLE_API_KEY = 'patrgI0a9jrqSYQFl.0aeb268d8112aadea5cc60363ecc57994754d7d2b3a6dc71cdee307f23d9cfff';
const AIRTABLE_BASE_ID = 'appMnJ5OpcAn5M282';
const AIRTABLE_TABLE_NAME = 'Submissions';

async function uploadImageToImgBB(base64Image) {
  const formData = new FormData();
  formData.append('image', base64Image.split(',')[1]); // remove "data:image/png;base64,"

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  return data.data.url;
}

async function sendToAirtable(title, name, imageUrl) {
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        Title: title,
        Name: name,
        Image: [{ url: imageUrl }],
      },
    }),
  });

  const data = await res.json();
  return data;
}

document.getElementById('submissionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const name = document.getElementById('name').value;
  const base64 = canvas.toDataURL('image/png');

  try {
    const imageUrl = await uploadImageToImgBB(base64);
    const airtableRes = await sendToAirtable(title, name, imageUrl);
    alert('Submitted successfully!');
    console.log('Airtable response:', airtableRes);
  } catch (err) {
    console.error('Upload error:', err);
    alert('Something went wrong.');
  }
});

    