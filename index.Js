
// ========== GLOBAL VARIABLES ========== 
let currentUser = null; // NO USER LOGGED IN ? REMAIN NULL
let selectedElement = null; // HOLD A REFERENCE TO A DOM ELEMENT OR REMAIN NULL IN NON IS SELECTED
let draggedElement = null;  // USED WHILE MOVING ELEMENTS AROUND THE CANVAS
let elementCounter = 0; // EACH TIME AN ELEMENT IS ADDED. THIS COUNTER CAN BE INCREMENTED
let actionHistory = []; // EACH ENTRY IS USUALLY A SNAPSHOT OF `CANVAS.INNERHTML`
let historyIndex = -1;  // NO ACTION YET, 0 = FIRST ACTION, ETC.
let currentSiteName = null;
const CONSENT_KEY = "cookie-consent";

// ========== TAB SWITCHING (Login/Register) ==========
function switchTab(tab, event) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');

    // Remove active class from all tabs
    tabs.forEach(tabs => tabs.classList.remove('active'));

    // Highlight the clicked tab
    event.target.classList.add('active');

    // Show the corresponding form
    loginForm.style.display = tab === 'login' ? 'block' : 'none';
    registerForm.style.display = tab === 'register' ? 'block' : 'none';
}
// ========== END TAB SWITCHING (Login/Register) ==========

// ========== DOM CONTENT LOADED EVENTS ==========
document.addEventListener('DOMContentLoaded', () => {

    showConsent();

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (event) => {
            const selectedTab = event.target.innerText.toLowerCase(); 
            switchTab(selectedTab, event);
        });
    });

// ========== LOGIN FORM SUBMIT ==========
document.getElementById('loginForm').addEventListener('submit', function (element) {
    element.preventDefault();

    const userName = this.querySelector('input[type="text"]').value.trim();
    const password = this.querySelector('input[type="password"]').value;

    // Get users from localStorage 
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.userName === userName && u.password === password);

    // Validate Login
    if (user) {
        currentUser = user;
        const welcome = document.getElementById('welcomeMessage');
        welcome.textContent =  `Welcome ${currentUser.userName}!`;
        showApp();
    } else {
        alert('Invalid Username or password. Please register first.');
    }
});
// ========== END LOGIN FORM SUBMIT ==========

// ========== REGISTER FORM SUBMIT ==========

document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const fullName = this.querySelector('input[placeholder="Enter your Full name"]').value.trim();
    const userName = this.querySelector('input[placeholder="Enter your Username"]').value.trim();
    const password = this.querySelector('input[placeholder="Create a Password"]').value;
    const confirmPassword = this.querySelector('input[placeholder="Confirm your Password"]').value;

    // Check if password match
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');

    // Prevent duplicate registration
    if (users.find(u => u.userName === userName)) {
        alert('User already registered. Please log in.');
        return;
    }

    // Save new User 
    const newUser = { name: fullName, userName, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Registration successful. Please log in.');
    switchTab('login', { target: document.querySelector('.auth-tab[data-tab="login"]') });
});
// ========== END REGISTER FORM SUBMIT ==========

// ========== DRAG & DROP ELEMENTS ==========
document.querySelectorAll('.element-item').forEach(item => {
        item.addEventListener('dragstart', function (e) {
            draggedElement = this.dataset.type;
            this.style.opacity = '0.5';
        });

        item.addEventListener('dragend', function () {
            this.style.opacity = '1';
        });
    });
    
    const canvas = document.getElementById('canvas');

    // Allow dropping on the Canvas
    canvas.addEventListener('dragover', function (e) {
        e.preventDefault();
    });
    // Drop element onto canvas
    canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!draggedElement) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        createCanvasElement(draggedElement, x, y);
        draggedElement = null;
    });

    // Deselect elements when clicking outside
    canvas.addEventListener('click', function (e) {
        if (e.target === canvas) {
            document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected'));
            selectedElement = null;
            document.getElementById('propertiesContent').innerHTML =
                '<p style="color: #64748b; text-align: center; margin-top: 50px;">Select an element to edit its properties</p>';
        }
    });
});
// ========== END DOM CONTENT LOADED EVENTS ==========

// ========== LOGOUT FUNCTION ==========
function logout() {
    currentUser = null;
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('canvas').innerHTML = '<div class="welcome-message"><h3>Welcome to Web Designer</h3><p>Drag and drop elements from the sidebar to start building your website</p></div>';
}
// ========== END LOGOUT FUNCTION ==========

// ========== CREATE ELEMENT ON CANVAS ==========
function createCanvasElement(type, x, y) {
    elementCounter++;
    const element = document.createElement('div');
    element.className = 'canvas-element';
    element.id = `element-${elementCounter}`;
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.dataset.type = type;

    const welcomeMsg = canvas.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    // Different element templates based on type
    switch (type) {
        // CTA Form Case
        case 'ctaform':
            element.innerHTML = `
            <form class="form-element" style="padding: 15px; background: #f8fafc; border: 1px dashed #ccc; border-radius: 10px;">
            <input type="text" placeholder="Full Name" style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #ccc; background: white; color: black;" />
            <input type="text" placeholder="Username" style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #ccc; background: white; color: grey;" />
            <button type="button" style="width: 100%; padding: 10px; border-radius: 6px; background: #667eea; color: white; border: none;">Send</button>
            </form>`;
            element.style.width = '280px';
            element.style.height = 'auto';
            break;
        // Banner Case    
        case 'banner':
            const sizeChoice = prompt("Choose banner size:\n1 - 250x250\n2 - 300x600\n3 - CUSTOMIZED",  "1");
            let width = 250;
            let height = 250;
            
            if (sizeChoice === "1") {
                width = 250;
                height = 250; 
            }
            else if (sizeChoice === "2") {
                width = 300;
                height = 600;
            }
            else if (sizeChoice === "3") {
                width = '';
                height = '';
            }

            else if (!"1", "2", "3") return alert('Please enter a valid number.')

            element.innerHTML = `
            <div class="banner-element" contenteditable="true" style="background-size: cover; background-position: center;">
            Your Amazing Banner
            </div>
            <div style="margin-top:10px; text-align:center;">
            <input type="file" accept="image/*" style="display:none;" />
            <button type="button" class="upload-bg-image">Upload Background Image</button>
            </div>`;
            element.style.width = width + 'px';
            element.style.height = height + 'px';
            break;
        // Text Case
        case 'text':
            element.innerHTML = `
            <div class="text-element" contenteditable="true" style="background-size: cover; background-position: center;">
            Click to edit text
            </div>
            <div style="margin-top:10px; text-align:center;">
            <input type="file" accept="image/*" style="display:none;" />
            <button type="button" class="upload-bg-image">Upload Background Image</button>
            </div>`;            
            element.style.width = '200px';
            break;
        // Image Case
        case 'image':
            element.innerHTML = `
            <div class="image-element" style="text-align:center; cursor:pointer;">
            <p>Click to upload image</p>
            <input type="file" accept="image/*" style="display:none;">
            <img src="" style="max-width:500px; max-height:500px; display:none; margin-top:10px;" />
            </div>`;
            break;
        // Button Case
        case 'button':
            element.innerHTML = '<button class="btn btn-primary">Click Me</button>';
            break;
        // From Case
        case 'form':
            element.innerHTML = `
            <form class="form-element">
            <input type="text" placeholder="Your Name" style="display:block; margin-bottom:10px; width:100%; padding:8px; color: black" />
            <input type="text" placeholder="Your Username" style="display:block; margin-bottom:10px; width:100%; padding:8px; color: grey"/>
            </form>`;
            element.style.width = '250px';
            element.style.height = 'auto';
            break;
        // Columns Case
        case 'columns':
            element.innerHTML = `
            <div style="display: flex; gap: 10px;">
            <div class="column" contenteditable="true" style="flex: 1; min-height: 100px; background: #e2e8f0; padding: 10px;">Column 1</div>
            <div class="column" contenteditable="true" style="flex: 1; min-height: 100px; background: #e2e8f0; padding: 10px;">Column 2</div>
            </div>`;
            element.style.width = '400px';
            element.style.height = 'auto';
            break;
        // Section Case
        case 'section':
            element.innerHTML = `
            <div style="padding: 20px; background: #f3f4f6; border: 1px dashed #cbd5e1;" contenteditable="true">
            Section Area 
            </div>`;
            element.style.width = '400px';
            element.style.height = '150px';
            break;
        // Default Case
        default:
            element.innerHTML = `<div style="padding: 15px; background: #f3f4f6; border-radius: 6px;">${type.charAt(0).toUpperCase() + type.slice(1)} Element</div>`;
    }

// Special handling for image element uplaod
if (type === 'image') {

    // Select the main image container within the newly created element
    const imageElement = element.querySelector('.image-element');

    // Get the hidden file input element used to uplaod an image 
    const fileInput = imageElement.querySelector('input[type="file"]');

    // Get the <img> tag where the uplaoded image will be displayed
    const imgTag = imageElement.querySelector('img');

    // When the user clicks on the image container, trigger the file input click
    imageElement.addEventListener('click', () => {
        const img = imageElement.querySelector('img');
        const hasImage = img && img.src && img.style.display !== 'none';
        
        if (!hasImage) {
            fileInput.click();
        }
    });

    // Listen for a file selection event (When the user chooses an image)
    fileInput.addEventListener('change', (event) => {
        // Get the selected file (first file only)
        const file = event.target.files[0];
        // If no file is selected, stop the function
        if (!file) return;

        // Create a new FileReader to read the selcted image file 
        const reader = new FileReader();

        // When the file is fully read, update the <img> source
        reader.onload = function (e) {
            imgTag.src = e.target.result;   // Set the <img> source to the uplaoded file
            imgTag.style.display = 'block';     // Make sure the image is visible
            imageElement.querySelector('p').style.display = 'none';     // Hide the "Click to uplaod" placeholder text
            addToHistory();     
        };
        // Start reading the file as a Data URL 
        reader.readAsDataURL(file);
    });
}
// End Spacial handling for image element uplaod

    // Make the element draggable
    makeDraggable(element);
    element.addEventListener('click', function (e) {
        e.stopPropagation();    // Prevent the click event from propagating to the canvas ( Avoids deselecting element)
        selectElement(this);    // Mark this element as the currently selected element
    });
    // Add the element to the canvas
    canvas.appendChild(element);
    // Immediatly select the newly added element so its properties are displayed
    selectElement(element);
    // Save the current state of the canvas to the action history (for Undo/Redo)
    addToHistory();
}
// ========== END CREATE ELEMENT ON CANVAS =========

// ========== DRAGGABLE FUNCTIONALITY ==========
function makeDraggable(element) {
    
    let isDragging = false;
    
    let startX, startY, initialX, initialY;

    element.addEventListener('mousedown', function (e) {
      
        if (e.target.contentEditable === 'true') return;
        // Enable dragging mode
        isDragging = true;
        element.classList.add('dragging');

        // Record the initial mouse position
        startX = e.clientX;
        startY = e.clientY;

        initialX = parseInt(element.style.left || 0);
        initialY = parseInt(element.style.top || 0);

        // Attach event listeners to track mouse movement and release
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    });

    // Function to handle the dragging movement 
    function drag(e) {
        if (!isDragging) return;

        // Calculate how much the mouse has moved since the initial click
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Move the element by updating its left and top positions
        element.style.left = (initialX + deltaX) + 'px';
        element.style.top = (initialY + deltaY) + 'px';
    }

    // Stop dragging when mouse is released
    function stopDrag() {
        isDragging = false; 
        element.classList.remove('dragging');   

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    
        addToHistory();
    }
}
// ========== END DRAGGABLE FUNCTIONALITY ==========

// ========== ELEMENT SELCTION & PROPERTIES ==========

// == SELECTELEMENT FINCTION ==
function selectElement(element) {
    
    document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected'));

    element.classList.add('selected');
    selectedElement = element;
   
    showProperties(element);
}
// == END SELECTELEMENT FUNCTION ==

// == SHOWPROPERTIES FUNCTION ==
function showProperties(element) {
    const propertiesContent = document.getElementById('propertiesContent');
    const type = element.dataset.type; 

    let html = `<h4>Element: ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>`;

    html += `
        <div class="property-group">
            <label>Position X</label>
            <label>Font Size (px)</label>
            <input type="number" class="property-input" value="16" onchange="updateFontSize(this.value)">
            <input type="number" class="property-input" value="${parseInt(element.style.left || 0)}" onchange="updatePosition('left', this.value)">
        </div>
        <div class="property-group">
            <label>Font Family</label>
            <label>Position Y</label>
             <select class="property-input" onchange="updateFontFamily(this.value)">
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
            <option value="Trebuchet MS">Trebuchet MS</option>
            <option value="Courier New">Courier New</option>
            </select>
            <input type="number" class="property-input" value="${parseInt(element.style.top || 0)}" onchange="updatePosition('top', this.value)">
        </div>
        <div class="property-group">
            <label>Width</label>
            <input type="number" class="property-input" value="${parseInt(element.style.width || 200)}" onchange="updateSize('width', this.value)">
        </div>
    `;



    if (type === 'banner' || type === 'text') {

           html +=`
            <div class="property-group">
                <label>Background Color</label>
                <input type="color" class="color-picker" value="#667eea" onchange="updateBackground(this.value)">
            </div>
            <div class="property-group">
                <label>Text Color</label>
                <input type="color" class="color-picker" value="#ffffff" onchange="updateTextColor(this.value)">
            </div>`;
        
    // Setup file input and uplaod button for background image
    const fileInput = element.querySelector('input[type="file"]');
    const uploadBtn = element.querySelector('.upload-bg-image');
    const contentDiv = element.querySelector('.banner-element, .text-element');

    // Trigger file selection when uplaod button is clicked
    uploadBtn.addEventListener('click', () => fileInput.click());

    // Handle file uplaod and set as background image
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            contentDiv.style.backgroundImage = `url(${e.target.result})`;
            contentDiv.style.backgroundSize = 'cover';
            contentDiv.style.backgroundPosition = 'center';
            addToHistory(); // Save state for undo/redo
        };
        reader.readAsDataURL(file);
    });
}

    if (type === 'image') {
    const img = element.querySelector('img');
    const imgWidth = parseInt(img?.style.width || img?.naturalWidth || 100);
    const imgHeight = parseInt(img?.style.height || img?.naturalHeight || 100);

    html += `
        <div class="property-group">
            <label>Image Width</label>
            <input type="number" class="property-input" value="${imgWidth}" onchange="updateImageSize('width', this.value)">
        </div>
        <div class="property-group">
            <label>Image Height</label>
            <input type="number" class="property-input" value="${imgHeight}" onchange="updateImageSize('height', this.value)">
        </div>
    `;
}   
    propertiesContent.innerHTML = html;
}
// == END SHOWPROPERTIES ==

// == UPDATEIMAGE - Update the size of the selected image ==
function updateImageSize(property, value) {
    if (selectedElement && selectedElement.dataset.type === 'image') {
        const img = selectedElement.querySelector('img');
        if (img) {
            img.style[property] = value + 'px';
            addToHistory();
        }
    }
}

// == UPADTEPOSITION - Update element postion (top/left) ==
function updatePosition(property, value) {
    if (selectedElement) {
        selectedElement.style[property] = value + 'px';
        addToHistory();
    }
}

// == UPDATESIZE - Update general element size (width/height) ==
function updateSize(property, value) {
    if (selectedElement) {
        selectedElement.style[property] = value + 'px';
        addToHistory();
    }
}

// == UPDATEBACKGROUND - Update background color for banner or text element ==
function updateBackground(color) {
    if (selectedElement) {
        const inner = selectedElement.querySelector('.banner-element, .text-element, [contenteditable="true"]');
        if (inner) {
            inner.style.background = color;
            addToHistory();
        }
    }
}

// == UPDATETEXTCOLOR - Update text color for banner or text element ==
function updateTextColor(color) {
    if (selectedElement) {
        const inner = selectedElement.querySelector('.banner-element, .text-element, [contenteditable="true"]');
        if (inner) {
            inner.style.color = color;
            addToHistory();
        }
    }
}

// == DELETESELECTED - Delete the selcted element ==
function deleteSelected() {
    if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        document.getElementById('propertiesContent').innerHTML =
            '<p style="color: #64748b; text-align: center; margin-top: 50px;">Select an element to edit its properties</p>';
        addToHistory();
    }
}

// == ADDTOHISTORY - Add actions to history canvas ==
function addToHistory() {
    const state = canvas.innerHTML;
    actionHistory.splice(historyIndex + 1); // remove any redo states after current index
    actionHistory.push(state);
    historyIndex++;
   
    if (actionHistory.length > 50) {
        actionHistory.shift(); // Remove the oldest entry
        historyIndex--;
    }
}
// == UNDOACTION - Undo the last action ==
function undoAction() {
    if (historyIndex > 0) {
        historyIndex--;
        canvas.innerHTML = actionHistory[historyIndex];
        rebindEvents(); // Rebind element events since innerHTML replacement clears them
    }
}

// == REDOACTION - Redo the last action ==
function redoAction() {
    if (historyIndex < actionHistory.length - 1) {
        historyIndex++;
        canvas.innerHTML = actionHistory[historyIndex];
        rebindEvents();
    }
}

// == REBINDEVENTS - Rebind draggable and click events after undo/redo or loading a site ==
function rebindEvents() {
    document.querySelectorAll('.canvas-element').forEach(element => {
        element.addEventListener('click', function (e) {
            e.stopPropagation();
            selectElement(this);
        });
        makeDraggable(element); // Ensure element stay draggable 
    });
}

// == MODAL VIEW ==
function openSaveModal() {
    const input = document.getElementById('siteNameInput');
    input.value = currentSiteName || '';
    document.getElementById('siteNameModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('siteNameModal').style.display = 'none';
    document.getElementById('siteNameInput').value = ''; 
}
// == END MODAL VIEW ==

document.getElementById('confirmBtn').addEventListener('click', () => {
    const siteName = document.getElementById('siteNameInput').value.trim();
    if (!siteName) {
        alert("Please enter a site name.");
        return;
    }
    saveSite(siteName);
    closeModal();
    currentSiteName = siteName;
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    closeModal();
});

// == SAVESITE - Save the current site to localStorage ==
function saveSite(siteName) {
    if (!currentUser) {
        alert("Please log in to save.");
        return;
    }

    siteName = siteName?.trim();
    if (!siteName) {
        alert("Please enter a site name.");
        return;
    }

    const sites = JSON.parse(localStorage.getItem('sites') || '{}');
    const userSites = sites[currentUser.userName] || [];
    const siteHTML = canvas.innerHTML;
    const campaignType = canvas.dataset.campaignType || "general";

    const existingSiteIndex = userSites.findIndex(site => site.name === siteName);

    if (existingSiteIndex !== -1) {
        
        userSites[existingSiteIndex].content = siteHTML;
        userSites[existingSiteIndex].type = campaignType;
        userSites[existingSiteIndex].updatedAt = Date.now();
        alert("Site updated successfully!");
    } else {
    
        const siteData = {
            id: Date.now(),
            name: siteName,
            content: siteHTML,
            type: campaignType,
            createdAt: Date.now()
        };
        userSites.push(siteData);
        alert("New site saved successfully!");
    }
    
    sites[currentUser.userName] = userSites;
    localStorage.setItem('sites', JSON.stringify(sites));
}

// == EXPORTSITE - Export the current site as a downloadable HTML file ==
function exportSite() {
    const exportCanvas = document.createElement('div');
    exportCanvas.innerHTML = canvas.innerHTML;
    exportCanvas.querySelectorAll('[contenteditable]').forEach(element => {
        element.removeAttribute('contenteditable');
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
    <style>
         * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 20px;
            font-family: 'Roboto' Arial, sans-serif; 
            background-color:rgb(161, 161, 161) 
        }

        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .auth-box {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateY(0);
            transition: all 0.3s ease;
        }

        .auth-box:hover {
            transform: translateY(-5px);
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #000000, #858585);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 800;
        }

        .logo p {
            color: #666;
            margin-top: 5px;
            font-size: 0.9rem;
        }

        .auth-tabs {
            display: flex;
            margin-bottom: 30px;
            background: #f8f9fa;
            border-radius: 12px;
            padding: 4px;
        }

        .auth-tab {
            flex: 1;
            padding: 12px;
            text-align: center;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
            color: #000000;
        }

        .auth-tab.active {
            background: white;
            color: #667eea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #000000;
            font-weight: 500;
        }

        .form-group input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #00000060;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: rgb(255, 255, 255);
            color: rgba(0, 0, 0, 0.658);
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .auth-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #000000, #000000ff);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .auth-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

     
        .app-container {
            display: none;
            min-height: 100vh;
            background: #f8fafc;
        }

        .header {
            background: white;
            padding: 20px 30px;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header .logo h2 {
            background: linear-gradient(135deg, #000000, #858585);            
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 1.8rem;
            font-weight: 800;
        }

        .header-actions {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .btn {
            padding: 10px 20px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #000000, #000000ff);
            color: white;
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #383838ff;
        }

        .btn:hover {
            transform: translateY(-1px);
        }

        .main-content {
            display: flex;
            height: calc(100vh - 80px);
        }

        .sidebar {
            width: 280px;
            background: white;
            border-right: 1px solid #0000006e;
            padding: 30px 20px;
            overflow-y: auto;
        }

        .sidebar h3 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.1rem;
        }

        .element-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 30px;
        }

        .element-item {
            padding: 15px 12px;
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            text-align: center;
            transition: all 0.2s ease;
            font-size: 0.9rem;
            color: #475569;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        .element-item:hover {
            background: #f1f5f9;
            border-color: #667eea;
            transform: translateY(-2px);
        }

        .element-icon {
            font-size: 1.5rem;
        }

        .canvas-area {
            flex: 1;
            padding: 30px;
            background: #f1f5f9;
            position: relative;
        }

        .canvas {
            background: white;
            min-height: 800px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
        }

        .canvas-element {
            position: absolute;
            border: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .banner-element {
            background: linear-gradient(135deg, #000000 0%, #807e81ff 100%);
            color: white;
            padding: 40px;
            text-align: center;
            border-radius: 8px;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .text-element {
            padding: 15px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            min-width: 200px;
            min-height: 50px;
        }

        .image-element {
            width: 200px;
            height: 150px;
            background: #e2e8f0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            font-size: 0.9rem;
        }

        .properties-panel {
            width: 300px;
            background: white;
            border-left: 1px solid #e2e8f0;
            padding: 30px 20px;
            overflow-y: auto;
        }

        .properties-panel h3 {
            font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.1rem;
        }

        .property-group {
            margin-bottom: 25px;
        }

        .property-group label {
            display: block;
            margin-bottom: 8px;
            color: #374151;
            font-weight: 500;
            font-size: 0.9rem;
        }

        .property-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.9rem;
        }

        .property-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .upload-bg-image {
            display: none;
        }
            
    </style>
</head>
<body>
    <header class="logo h1"><h1>My Website</h1></header>
    <main>
        <div class="canvas">${exportCanvas.innerHTML}</div>
    </main>
<footer class="logo h1"><p>Exported with WebDesigner</p></footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'website.html';
    link.click();
}

// == SHOWAPP - Switch from login/dasboard to the main app ==
function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    loadUserSites();
    document.getElementById('dashboardContainer').style.display = 'flex';
}

// == CREATENEWSITE - Create a new site with a selected campaign type ==
function createNewSite() {
    let type;
    while (true) {
        type = prompt("Custom Page: \n1 - Custom Page", 
            "1"
        );
        if ( type === null) return;
        if ( type === "1") break; 
        alert('Please enter 1.')
    }

    const campaignType = "custom";

    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';

    document.getElementById('canvas').innerHTML = `
        <div class="welcome-message">
            <h3>Welcome to Web Designer</h3>
            <p>Drag and drop elements from the sidebar to start building your ${campaignType}.</p>
        </div>
    `;

    canvas.dataset.campaignType = campaignType;
}

// == LOADUSERSITE - Load user sites from localStorage into the dashboard list ==
function loadUserSites() {
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = '';

    const sites = JSON.parse(localStorage.getItem('sites') || '{}');
    const userSites = sites[currentUser.userName] || [];

    if (userSites.length === 0) {
        siteList.innerHTML = '<p>No saved sites yet.</p>';
        return;
    }

    userSites.forEach(site => {
        const item = document.createElement('div');
        item.className = 'site-item';
        item.innerHTML = `
            <span>${site.name} <small style="color: #888;">(${site.type || 'general'})</small></span>
            <div>
                <button class="btn btn-secondary" onclick="loadSite(${site.id})">Load</button>
                <button class="btn btn-secondary" onclick="deleteSite(${site.id})">Delete</button>
            </div>
        `;
        siteList.appendChild(item);
    });
}

// == LOADSITE - Load a saved site into the canvas ==
function loadSite(id) {
    const sites = JSON.parse(localStorage.getItem('sites') || '{}');
    const userSites = sites[currentUser.userName] || [];
    const site = userSites.find(s => s.id === id);
    if (!site) return alert('Site not found.');

    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('canvas').innerHTML = site.content;
    canvas.dataset.campaignType = site.type || "general";
    currentSiteName = site.name;
    rebindEvents(); // Rebind events since innerHTML replacment clears them
}

// == DELETESITE - Delete a saved site ==
function deleteSite(id) {
    const sites = JSON.parse(localStorage.getItem('sites') || '{}');
    let userSites = sites[currentUser.userName] || [];
    userSites = userSites.filter(s => s.id !== id);
    sites[currentUser.userName] = userSites;
    localStorage.setItem('sites', JSON.stringify(sites));
    loadUserSites();
}

// == UPDATEFONTSIZE - Update text font size ==
function updateFontSize(size) {
    if (selectedElement) {
        const inner = selectedElement.querySelector('.banner-element, .text-element, [contenteditable="true"]');
        if (inner) {
            inner.style.fontSize = size + 'px';
            addToHistory();
        }
    }
}

// == UPDATEFONTFAMILY - Update text font family ==
function updateFontFamily(family) {
    if (selectedElement) {
        const inner = selectedElement.querySelector('.banner-element, .text-element, [contenteditable="true"]');
        if (inner) {
            inner.style.fontFamily = family;
            addToHistory();
        }
    }
}

// == Marketin Template ==
function startMarketing() {
  let choice;
  while (true) {
    choice = prompt(
      "Marketing (email) template (650px):\n1 - Simple Newsletter\n2 - Promo Banner + Text\n3 - Two Articles",
      "1"
    );
    if (choice === null) return; 
    if (choice === "1" || choice === "2" || choice === "3") break;
    alert("Please enter a valid number (1, 2, or 3).");
  }

  ensureAppView();
  const canvas = document.getElementById('canvas');
  canvas.dataset.campaignType = "marketing";
  canvas.innerHTML = marketingTemplate(choice);
  if (typeof rebindEvents === 'function') rebindEvents();
  if (typeof addToHistory === 'function') addToHistory();
}
// == Typeof - Tells me the data type of a vlaue. ==

// == Landing Template ==
function startLanding() {
  let choice;
  while (true) {
    choice = prompt(
      "Landing page template:\n1 - Hero + CTA\n2 - Two Columns + CTA\n3 - Feature List + CTA",
      "1"
    );
    if (choice === null) return;
    if (choice === "1" || choice === "2" || choice === "3") break;
    alert("Please enter a valid number (1, 2, or 3).");
  }

  ensureAppView();
  const canvas = document.getElementById('canvas');
  canvas.dataset.campaignType = "landing";
  canvas.innerHTML = landingTemplate(choice);
  if (typeof rebindEvents === 'function') rebindEvents();
  if (typeof addToHistory === 'function') addToHistory();
}

// === TEMPLATES SITES ===
function marketingTemplate(kind) {
    const WRAP = 'word-break:break-word; overflow-wrap:anywhere;';
    const frameOpen = `<div style="max-width:650px; margin:0 auto; background: #fff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; min-height:600px; padding-bottom:24px; position:relative;">`;
    const frameClose = `</div>`;

    if (kind === "2") {
    return `
      ${frameOpen}
        ${bannerBlock("Big Promo This Week", WRAP, 610, 200, 20, 20)}
        ${textBlock("Write your email copy here...", WRAP, 610, 250)}
      ${frameClose}
    `;
    }

    if (kind === "3") {
    return `
      ${frameOpen}
        ${sectionTitle("This Week's Articles", WRAP, 610, 20)}
        ${twoArticles(WRAP, 610, 80)}
      ${frameClose}
    `;
    }

    return  `
       ${frameOpen}
        ${sectionTitle("Newsletter Title", WRAP, 610, 20)}
        ${textBlock("Welcome to our monthly newletter..", WRAP, 610, 80)}
      ${frameClose}
    `;
}

function landingTemplate(kind) {
    const WRAP = 'word-break:break-word;overflow-wrap:anywhere;';
    const pageOpen  = `<div style="background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08);position:relative;min-height:800px">`;
    const pageClose = `</div>`;
    const CTA = (top, left = 40, text="Get Started") => `
    <div class="canvas-element" data-type="button" style="left:${left}px;top:${top}px">
      <a href="#cta" class="btn btn-primary" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#000;color:#fff;text-decoration:none">${text}</a>
    </div>`;

    if (kind === "2") {
        return `
      ${pageOpen}
        ${sectionTitle("Grow Faster with Our Tool", WRAP, "80%", 40, 40)}
        ${twoCols(WRAP, "80%", 120, 40)}
        ${CTA(300)}
      ${pageClose}
    `;
  }
  if (kind === "3") {
        return `
      ${pageOpen}
        ${sectionTitle("Why Choose Us", WRAP, "80%", 40, 40)}
        ${featureList(["Fast setup","Great support","Powerful analytics"], WRAP, "80%", 120, 40)}
        ${CTA(280)}
      ${pageClose}
    `;
  }

    return `
    ${pageOpen}
      ${bannerBlock("Your Product Headline", WRAP, 600, 220, 40, 40, true)}
      ${CTA(300)}
    ${pageClose}
    `;
}
// === END TEMPLATES SITES ===

function bannerBlock(text, WRAP, width, height, left, top, showUploader = false) {
  return `
    <div class="canvas-element" data-type="banner" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px">
      <div class="banner-element" contenteditable="true"
           style="${WRAP}background:linear-gradient(135deg,#000,#764ba2);color:#fff;padding:40px;text-align:center;border-radius:12px;font-size:28px;font-weight:700;">
        ${text}
      </div>
      ${showUploader ? `
      <div style="margin-top:10px;text-align:center;">
        <input type="file" accept="image/*" style="display:none;" />
        <button type="button" class="upload-bg-image">Upload Background Image</button>
      </div>` : ``}
    </div>`;
}

function sectionTitle(text, WRAP, width, top, left = 20) {
  const w = (typeof width === 'number') ? `${width}px` : width;
  return `
    <div class="canvas-element" data-type="section" style="left:${left}px;top:${top}px;width:${w}">
      <div contenteditable="true" style="${WRAP}padding:20px;font-size:32px;font-weight:700;">${text}</div>
    </div>`;
}

function textBlock(text, WRAP, width, top, left = 20) {
  return `
    <div class="canvas-element" data-type="text" style="left:${left}px;top:${top}px;width:${width}px">
      <div class="text-element" contenteditable="true"
           style="${WRAP}padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
        ${text}
      </div>
      <div style="margin-top:10px;text-align:center;">
        <input type="file" accept="image/*" style="display:none;" />
        <button type="button" class="upload-bg-image">Upload Background Image</button>
      </div>
    </div>`;
}

function twoCols(WRAP, width, top, left = 40) {
  const w = (typeof width === 'number') ? `${width}px` : width;
  return `
    <div class="canvas-element" data-type="columns" style="left:${left}px;top:${top}px;width:${w}">
      <div style="display:flex;gap:16px">
        <div contenteditable="true" style="${WRAP}flex:1;background:#f3f4f6;padding:16px;border-radius:8px;">Left column text</div>
        <div contenteditable="true" style="${WRAP}flex:1;background:#f3f4f6;padding:16px;border-radius:8px;">Right column text</div>
      </div>
    </div>`;
}


function twoArticles(WRAP, width, top, left = 20) {
  return `
    <div class="canvas-element" data-type="columns" style="left:${left}px;top:${top}px;width:${width}px">
      <div style="display:flex;gap:16px">
        <div contenteditable="true" style="${WRAP}flex:1;background:#f3f4f6;padding:16px;border-radius:8px;">Article A</div>
        <div contenteditable="true" style="${WRAP}flex:1;background:#f3f4f6;padding:16px;border-radius:8px;">Article B</div>
      </div>
    </div>`;
}

function featureList(items, WRAP, width, top, left = 40) {
  const w = (typeof width === 'number') ? `${width}px` : width;
  return `
    <div class="canvas-element" data-type="section" style="left:${left}px;top:${top}px;width:${w}">
      <ul contenteditable="true" style="${WRAP}padding:20px;background:#f8fafc;border-radius:8px;line-height:1.7">
        ${items.map(x=>`<li>${x}</li>`).join('')}
      </ul>
    </div>`;
}

function previewSite() {
  const canvas = document.getElementById('canvas');
  const type = canvas.dataset.campaignType || 'general';
  const wrapStart = (type === 'marketing')
    ? `<div style="max-width:650px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding-bottom:16px">`
    : `<div style="background:#fff;min-height:100vh">`;

  const window = window.open('', '_blank');
  if (!window) return alert('Popup blocked.');
  window.document.write(`
    <!doctype html>
    <html><head><meta charset="utf-8"><title>Preview (${type})</title></head>
    <body style="margin:0;padding:20px;background:#f8fafc">
      ${wrapStart}${canvas.innerHTML}</div>
    </body></html>
  `);
  window.document.close();
}

function ensureAppView() {
    const dashboard = document.getElementById('dashboardContainer');
    const app = document.getElementById('appContainer');
    if (dashboard) dashboard.style.display = 'none';
    if (app) app.style.display = 'block'
} 

function disableAuth(disabled) {
    document
    .querySelectorAll('#loginForm input, #loginForm button, #registerForm input, #registerForm button')
    .forEach(el => { el.disabled = disabled; });
}

function showConsent() {
  const accepted = localStorage.getItem(CONSENT_KEY) === 'true';
  const popup = document.getElementById('cookieConsent');

  if (!accepted) {
    popup.style.display = 'flex';
    popup.setAttribute('aria-hidden', 'false');
    disableAuth(true);
  } else {
    popup.style.display = 'none';
    popup.setAttribute('aria-hidden', 'true');
    disableAuth(false);
  }

  document.getElementById('consentAccept').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    popup.style.display = 'none';
    popup.setAttribute('aria-hidden', 'true');
    disableAuth(false);
  });

  document.getElementById('consentDecline').addEventListener('click', () => {
    alert('You must accept to use the app.');
  });
}

// Expose functions globally for inline events handlers
window.updateFontSize = updateFontSize;
window.updateFontFamily = updateFontFamily;
window.switchTab = switchTab;
window.saveSite = saveSite;
window.exportSite = exportSite;
window.undoAction = undoAction;
window.redoAction = redoAction;
window.deleteSelected = deleteSelected;
window.logout = logout;
window.updateBackground = updateBackground;
window.updateTextColor = updateTextColor;
window.updatePosition = updatePosition;
window.updateSize = updateSize;
window.updateImageSize = updateImageSize;
window.createNewSite = createNewSite;
window.loadSite = loadSite;
window.deleteSite = deleteSite;
window.openSaveModal = openSaveModal;
window.startLanding = startLanding;
window.startMarketing = startMarketing;
window.previewSite = previewSite;


