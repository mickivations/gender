// === Canvas Setup and Drawing Logic ===
const canvas = new fabric.Canvas('c');
const allTags = new Set();
const selectedTags = new Set();
let maxRadius = 3; 
let brushWidth = 6;
let opacityValue = 1;
let undoStack = [];
let redoStack = [];
let canDragObject;
let activeObject = null;
let isPanning = false;
let lastPosX = 0;
let lastPosY = 0;
let lastTouchDist = 0;
let isDraggingObject = false;
let isRestoringState = false;



canvas.setBackgroundColor('#000', canvas.renderAll.bind(canvas));

let currentColor = '#ffff00'; // Default color

function setCurrentColor(newColor) {
    currentColor = newColor;
  }
  
  function getCurrentColor() {
    return currentColor;
  }

  canvas.on('selection:created', (e) => {
    //activeObject = e.selected[0];
    canDragObject = false;
  });
  
  canvas.on('selection:updated', (e) => {
    //activeObject = e.selected[0];
    canDragObject = false;
  });
  
  canvas.on('selection:cleared', () => {
    activeObject = null;
  });
  

// Set the canvas internal width and height to match container size
function resizeCanvas() {
    const newSize = Math.min(window.innerWidth - 20, window.innerHeight - 100);
    console.log(newSize); 
    scaleCanvasObjectsToFit(newSize, newSize);
    maxRadius = newSize / 2.2;
    createTemplate(); // ← this updates and locks the template
    saveState();
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

  
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // initial call


function updatePreview(color) {
  const preview = document.getElementById('colorInput');
  if (preview) preview.style.backgroundColor = color;
}

// === Tool State ===
let currentTool = 'draw';
let isDrawing = false;
let currentPath = null;

// === Tool Handlers ===
function setTool(tool) {
  currentTool = tool;
  if (tool === 'draw') {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = 2;
  } else {
    canvas.isDrawingMode = false;
  }
}

function clearCanvas() {
  canvas.clear();
  canvas.setBackgroundColor('#000000', canvas.renderAll.bind(canvas));
  undoStack = [];
  redoStack = [];
  createTemplate();
}

function addText(text, options = {}) {
  const textbox = new fabric.Textbox(text, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    fontSize: 20,
    fill: currentColor,
    editable: true,
    ...options
  });
  canvas.add(textbox).setActiveObject(textbox);
}



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

// Disable free drawing mode
function disableDrawing() {
    canvas.isDrawingMode = false;
    canvas.selection = true;

   //pendingShapeType = null;  // Clear the pending shape
    //setActiveTool('Select/Move');
    console.log("drawing disabled");
    toggleToolMenu();
    toggleSelectMenu();
}

    // Enable free drawing mode and set the color
function enableDrawing() {
    console.log(fabric.version);
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = brushWidth / canvas.getZoom();
    canvas.freeDrawingBrush.color = currentColor;  // Set drawing color to the selected color
    canvas.freeDrawingBrush.opacity = opacityValue;
    //pendingShapeType = null;  // Clear the pending shape
    //setActiveTool('Free Draw');
    toggleToolMenu();
    closeSelectMenu();

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
    
    let newRadiiCount = maxRadius;
    // Draw radii lines
    const radiiLines = [];
    for (let i = 0; i < 3; i++) {
      const angle = (2 * Math.PI * i) / 3 - Math.PI / 2;
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

  function deleteObject() {
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

canvas.on('touch:gesture', function(opt) {
  if (opt.e.touches && opt.e.touches.length === 2) {
    // Pinch zoom
    const touch1 = opt.e.touches[0];
    const touch2 = opt.e.touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (lastTouchDist) {
      let zoom = canvas.getZoom();
      const zoomChange = dist / lastTouchDist;
      zoom *= zoomChange;
      zoom = Math.min(Math.max(0.5, zoom), 3);
      // Zoom around the center point between touches
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      canvas.zoomToPoint(center, zoom);
    }
    lastTouchDist = dist;
  }
});

canvas.on('touch:drag', function(opt) {
  if (!canvas.isDrawingMode && opt.e.touches.length === 1) {
    const e = opt.e.touches[0];
    if (!isPanning) {
      lastPosX = e.clientX;
      lastPosY = e.clientY;
      isPanning = true;
    }
    const vpt = canvas.viewportTransform;
    vpt[4] += e.clientX - lastPosX;
    vpt[5] += e.clientY - lastPosY;
    canvas.requestRenderAll();
    lastPosX = e.clientX;
    lastPosY = e.clientY;
  }
});

canvas.on('selection:cleared', () => {
    // Optional: reset hasBeenUnlocked on all objects when deselected
    canvas.getObjects().forEach(obj => {
      obj.hasBeenUnlocked = false;
    });
  });

canvas.on('touch:end', function(opt) {
  lastTouchDist = 0;
  if(ifPanning) saveState();
  isPanning = false;
});

canvas.on('mouse:down', (opt) => {
  if (canvas.isDrawingMode) return;

  const evt = opt.e;
  const clickedObj = canvas.findTarget(evt);

  if (clickedObj) {
    if (clickedObj !== activeObject) {
      // New object clicked
      activeObject = clickedObj;
      activeObject.lockMovementX = true;
      activeObject.lockMovementY = true;
      activeObject.hasBeenUnlocked = false;
      console.log('Locked new object on first click');

      isPanning = true;  // Allow pan on first click
      lastPosX = evt.clientX || evt.touches?.[0]?.clientX;
      lastPosY = evt.clientY || evt.touches?.[0]?.clientY;
    } else {
      // Same object clicked again
      if (activeObject.lockMovementX && activeObject.lockMovementY) {
        activeObject.lockMovementX = false;
        activeObject.lockMovementY = false;
        activeObject.hasBeenUnlocked = true;
        console.log('Unlocked object on second click');
      } else {
        console.log('Object already unlocked');
      }
      isPanning = false;  // Object is movable now, don’t pan
    }
  } else {
    // Clicked empty space
    activeObject = null;
    isPanning = true;
    lastPosX = evt.clientX || evt.touches?.[0]?.clientX;
    lastPosY = evt.clientY || evt.touches?.[0]?.clientY;
    canvas.discardActiveObject();
  }
});

// Panning
canvas.on('mouse:move', (opt) => {
  if (isPanning && !canvas.isDrawingMode) {
    const evt = opt.e;
    const posX = evt.clientX || evt.touches?.[0]?.clientX;
    const posY = evt.clientY || evt.touches?.[0]?.clientY;
    const deltaX = posX - lastPosX;
    const deltaY = posY - lastPosY;
    canvas.relativePan(new fabric.Point(deltaX, deltaY));
    lastPosX = posX;
    lastPosY = posY;
  }
});

canvas.on('mouse:up', () => {
  isPanning = false;
  
});

// Optional: Auto-unlock if dragging starts (if user drags instead of clicking)
canvas.on('object:moving', (opt) => {
  const obj = opt.target;
  if (obj.lockMovementX && obj.lockMovementY) {
    obj.lockMovementX = false;
    obj.lockMovementY = false;
    obj.hasBeenUnlocked = true;
    console.log('Unlocked object by drag');
  }
});

// Save state after changes
['object:added', 'object:modified', 'object:removed'].forEach(event => {
    canvas.on(event, saveState);
  });

// === Exports ===
export {
  canvas,
  setTool,
  getCurrentColor,
  setCurrentColor,
  undo,
  redo,
  clearCanvas,
  addText,
  updatePreview,
  allTags,
  selectedTags,
  enableDrawing,
  disableDrawing,
  createTemplate,
  resizeCanvas,
  deleteObject,
  duplicateObject,
  zoomIn,
  zoomOut
};


