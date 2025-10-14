// === Canvas Setup and Drawing Logic ===
const canvas = new fabric.Canvas('c');
const allTags = new Set();
const selectedTags = new Set();
let maxRadius = 3; 

const brushSizeSlider = document.getElementById("brushSize");
const brushPreviewDot = document.getElementById("brushPreviewDot");
let brushWidth = brushSizeSlider.value;

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

// === FIXED FLOATING MENU IMPLEMENTATION ===
function showFloatingMenu(selectedObject) {
  const menu = document.getElementById('floatingMenu');
  if (!menu || !selectedObject) return;
  
  const bounds = selectedObject.getBoundingRect();
  const canvasRect = canvas.getElement().getBoundingClientRect();
  
  // Get current viewport transform for proper positioning
  const vpt = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  
  // Transform object coordinates to screen coordinates
  const screenX = (bounds.left + bounds.width) * zoom + vpt[4] + canvasRect.left + 10;
  const screenY = bounds.top * zoom + vpt[5] + canvasRect.top - 10;
  
  menu.style.position = 'fixed';
  menu.style.left = screenX + 'px';
  menu.style.top = screenY + 'px';
  menu.style.display = 'block';
  menu.style.zIndex = '1001'; // Ensure it's above other elements
}

function hideFloatingMenu() {
  const menu = document.getElementById('floatingMenu');
  if (menu) {
    menu.style.display = 'none';
  }
}

// Enhanced canvas event handlers
canvas.on('selection:created', (e) => {
  activeObject = e.selected[0];
  if (activeObject && activeObject.hasBeenUnlocked) {
    showFloatingMenu(activeObject);
  }
});

canvas.on('selection:updated', (e) => {
  activeObject = e.selected[0];
  if (activeObject && activeObject.hasBeenUnlocked) {
    showFloatingMenu(activeObject);
  } else {
    hideFloatingMenu();
  }
});

canvas.on('selection:cleared', () => {
  activeObject = null;
  hideFloatingMenu();
  // Reset hasBeenUnlocked on all objects when deselected
  canvas.getObjects().forEach(obj => {
    obj.hasBeenUnlocked = false;
  });
});

// Update menu position when object moves
canvas.on('object:moving', (e) => {
  if (e.target === activeObject && activeObject.hasBeenUnlocked) {
    showFloatingMenu(activeObject);
  }
});

// Hide menu when canvas is panned or zoomed
canvas.on('mouse:wheel', () => {
  if (activeObject && activeObject.hasBeenUnlocked) {
    // Small delay to update position after zoom/pan
    setTimeout(() => {
      if (activeObject && activeObject.hasBeenUnlocked) {
        showFloatingMenu(activeObject);
      }
    }, 10);
  }
});

// === END FLOATING MENU ===

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
  if (preview) preview.style.color = color;
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
    console.log("drawing disabled");
   // toggleSelectMenu();
}

// Enable free drawing mode and set the color
function enableDrawing() {
    console.log(fabric.version);
    canvas.isDrawingMode = true;
    brushWidth = brushSizeSlider.value;
    canvas.freeDrawingBrush.width = brushWidth / canvas.getZoom();
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.opacity = opacityValue;
    //closeSelectMenu();
    // Hide floating menu when entering drawing mode
    hideFloatingMenu();
}

const sliderStyleEl = document.getElementById("sliderStyle");

function updateBrushPreviewDot(size) {
  const minTouchSize = 36;
  const border = Math.max((minTouchSize - size) / 2, 0);
  const color = getCurrentColor();

  const css = `
    #brushSize::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: ${minTouchSize}px;
      width: ${minTouchSize}px;
      background: ${color};
      border-radius: 50%;
      cursor: pointer;
      border: ${border}px solid black;
      transform: translate(0%, -45%); 
    }

    #brushSize::-moz-range-thumb {
      height: ${minTouchSize}px;
      width: ${minTouchSize}px;
      background: ${color};
      border-radius: 50%;
      cursor: pointer;
      border: ${border}px solid black;
      transform: translate(0%, -45%); 
    }
  `;

  console.log('Computed border:', border);
  sliderStyleEl.textContent = css;
}

brushSizeSlider.addEventListener("input", (e) => {
  const size = e.target.value;
  updateBrushPreviewDot(size);
  canvas.freeDrawingBrush.width = parseInt(size);
});

// Initialize on load
updateBrushPreviewDot(brushSizeSlider.value);

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
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      hideFloatingMenu();
      activeObject = null;
      saveState();
    }
  }

  function duplicateObject() {
    if (!activeObject) return;

    let duplicatedObject;

    if (activeObject.type === 'group') {
      duplicatedObject = activeObject.clone(function(cloned) {
        cloned.getObjects().forEach(function(obj) {
          obj.set({
            fill: obj.fill,
            stroke: obj.stroke,
          });
        });
      });
    } else {
      duplicatedObject = fabric.util.object.clone(activeObject);
      duplicatedObject.set({
        fill: activeObject.fill,
        stroke: activeObject.stroke,
      });
    }

    duplicatedObject.set({
      left: activeObject.left + 10,
      top: activeObject.top + 10,
    });

    canvas.add(duplicatedObject);
    canvas.setActiveObject(duplicatedObject);
    canvas.renderAll();
    
    // Update activeObject reference and show menu for new duplicate
    activeObject = duplicatedObject;
    activeObject.hasBeenUnlocked = true;
    activeObject.lockMovementX = false;
    activeObject.lockMovementY = false;
    showFloatingMenu(activeObject);
    
    saveState();
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

canvas.on('touch:end', function(opt) {
  lastTouchDist = 0;
  if(isPanning) saveState();
  isPanning = false;
});

// Updated mouse:down handler with proper floating menu integration
canvas.on('mouse:down', (opt) => {
  if (canvas.isDrawingMode) return;

  const evt = opt.e;
  const clickedObj = canvas.findTarget(evt);

  if (clickedObj) {
    if (clickedObj !== activeObject) {
      // New object clicked
      hideFloatingMenu(); // Hide menu from previous object
      activeObject = clickedObj;
      activeObject.lockMovementX = true;
      activeObject.lockMovementY = true;
      activeObject.hasBeenUnlocked = false;
      console.log('Locked new object on first click');

      isPanning = true;
      lastPosX = evt.clientX || evt.touches?.[0]?.clientX;
      lastPosY = evt.clientY || evt.touches?.[0]?.clientY;
    } else {
      // Same object clicked again
      if (activeObject.lockMovementX && activeObject.lockMovementY) {
        activeObject.lockMovementX = false;
        activeObject.lockMovementY = false;
        activeObject.hasBeenUnlocked = true;
        console.log('Unlocked object on second click');
        showFloatingMenu(activeObject);
      } else {
        console.log('Object already unlocked');
        // Refresh menu position
        showFloatingMenu(activeObject);
      }
      isPanning = false;
    }
  } else {
    // Clicked empty space
    activeObject = null;
    hideFloatingMenu();
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