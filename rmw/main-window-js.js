
 /* Copyright 2016, 2017, 2018, 2019 Roger Frybarger

    This file is part of Roger's Math Whiteboard LITE.

    Roger's Math Whiteboard LITE is free software: you can redistribute
    it and/or modify it under the terms of the GNU General Public
    License version 2 as published by the Free Software Foundation.

    Roger's Math Whiteboard LITE is distributed in the hope that it will
    be useful, but WITHOUT ANY WARRANTY; without even the implied
    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
    PURPOSE. See the GNU General Public License version 2 for more
    details.

    You should have received a copy of the GNU General Public
    License version 2 along with Roger's Math Whiteboard LITE.  If not,
    see <http://www.gnu.org/licenses/>.*/

// When the window gets resized call the resize function:
window.addEventListener('resize', onWindowResize);

// Some global variables & constants related to errors:
var displayErrorMessages = true;
var errorTimestamps = [];
const errorDelimiter = '\n-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~\n'; // eslint-disable-next-line max-len

// We had the cursor images here in base64 form, but chrome seems to have issues with that so we disabled that feature.

// A global var to keep track of the cursor image/value:
var currentCursorValue = 'default';

var allLoaded = false; // This is used to know if the app has finished loading.

// *****Here are some global variables that are directly related to drawing & working with the canvas:*****
var context; // This is the context used for drawing the image on the canvas
var eraserContext; // This is the context for the canvas used for the original images,
// which is where the eraser gets its data from.
var canUseTool; // This is used to determine when the tool/instrument can be used. For example, once the mouse is down,
// then the tool/instrument can be used. However, once the mouse is up, the tool/instrument cannot be used any more.
var tool = 'pen';
var prevX = 'NA'; // These two are typically used as the beginning of the line or the previous location of the instrument.
var prevY = 'NA';
var tempX = 'NA'; // These two are typically used to hold the current location of the instrument.
var tempY = 'NA';
var instrumentWidth = 5;
var instrumentColor = 'rgba(78, 78, 255, 1.0)';
var tempCanvasForInterval = 'NA';
var copiedSectionOfCanvas = 'NA';
var copiedSectionOfCanvasForScale = 'NA';
var areaSelected = false;
var textToInsert = '';
var maxUndoHistory = 31;  // This needs to be 1 higher than the actual number of operations desired.
var imageArrayForUndo = new Array(maxUndoHistory);
var currentPlaceInUndoArray;

// *****Here are some global variables that relate more to the programmatic side of things, and
// storing/ keeping track of the images.*****
var tempImageForWindowResize;

var maxNumberOfPages = 250;
var weGotKeyboardShortcuts = false;

var useWidescreenTemplates = true;
var useColorInvertedTemplates = false;

// This is for re-sizing the drawing area:
var tempForTimer;

// Here are the 4 arrays that store the current and original images and their original dimensions.
var arrayOfCurrentImages = new Array(1);
var arrayOfOriginalImages = new Array(1);
var arrayOfOriginalImagesX = new Array(1);
var arrayOfOriginalImagesY = new Array(1);
var currentPg = 1;

// There must be a better way to do this, probably through CSS, but until I/We figure it out,
// we will need these for various things. One example is where we draw, we need to subtract
// these out to align the mouse to the drawing spot.
var topToolbarWidth = 40;
var SideToolbarWidth = 150;


document.documentElement.style.overflow = 'hidden';
adjustSizeOfMenuButtonsToScreenSize();
initializeGlobalVariables();
initializeCanvas();

function continueAfterAppFinishedLoading1(){
  setUpGUIOnStartup();
  checkForScreenSizeIssues();
  document.addEventListener('keydown', validateKeyboardInputForDocument);
  allLoaded = true;
  alert('Welcome to Roger\'s Math Whiteboard LITE!\n\nThis online application is intended as a preview of the full version of Roger\'s Math Whiteboard which is available for free from rogersmathwhiteboard.com. You are free to use it as a basic online whiteboard and experiment with the available features but please be aware that the following functionality does not currently work in this preview:\n\n\n1. Opening sets of images.\n2. Saving the whiteboard pages as a set of images.\n3. Inserting screenshots of external content as pages.\n4. Inserting external images as pages.\n\n Also, this online preview has only been tested in Google Chrome. It may work in other browsers, but it is not intended to be used in them. If you choose to use this app in a browser other than Google Chrome you are doing so at your own risk. \n\n We hope you enjoy this preview. If you do, please consider downloading the full version from our website: rogersmathwhiteboard.com\n\nAlso, the principal author of this program is now offering online math & CIS tutoring!! Check out his website at tutoringbyroger.com');
  checkForUsingChrome();
}

function checkForUsingChrome(){
  // Source: https://stackoverflow.com/a/13348618
  // please note, 
  // that IE11 now returns undefined again for window.chrome
  // and new Opera 30 outputs true for window.chrome
  // but needs to check if window.opr is not undefined
  // and new IE Edge outputs to true now for window.chrome
  // and if not iOS Chrome check
  // so use the below updated condition
  var isChromium = window.chrome;
  var winNav = window.navigator;
  var vendorName = winNav.vendor;
  var isOpera = typeof window.opr !== "undefined";
  var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
  var isIOSChrome = winNav.userAgent.match("CriOS");

  if (isIOSChrome) {
     // is Google Chrome on IOS
  } else if(
    isChromium !== null &&
    typeof isChromium !== "undefined" &&
    vendorName === "Google Inc." &&
    isOpera === false &&
    isIEedge === false
  ) {
     // is Google Chrome
  } else { 
     alert('It seems that you are not using Google Chrome to run this app. You may run into several issues if you continue using this app in this browser. These include:\n1. Scroll bars may be too small.\n2. Up/down arrows may be too small. \n3. Touchscreens may not be recognised. \n4. App may randomly crash or break in unexpected ways.\nWe recommend using this app in Google Chrome. If you continue using this app in this browser you are doing so at your own risk.');
  }
}

function adjustSizeOfMenuButtonsToScreenSize(){
  // I know it is not good practice to hard-code this here, but I do not expect these to change
  // in any significant way, so for now, I am ok with hard-coding it. Furthermore, adding more
  // buttons to the GUI would take up valuable space. I feel that all the buttons that are necessary
  // are already here, and expandability can come within the drop down menus. In sum, I can't think
  // of a good reason to expand this in the future, so I don't see a problem with hard-coding it:
  var vButtonBarButtons = 
  document.querySelectorAll('#fileBtn, #colorBtn, #sizeBtn, #toolBtn, #insertPageBtn, #previousPageBtn, #nextPageBtn');
  
  // Essentially, this stuff just gets the dropdowns into an array so that we can work with them:
  var dropdowns = [];
  var el = document.getElementById('fileDropdown');
  dropdowns = Array.prototype.slice.call(el.getElementsByTagName('a'));
  el = document.getElementById('colorDropdown');
  dropdowns = dropdowns.concat(Array.prototype.slice.call(el.getElementsByTagName('a')));
  el = document.getElementById('sizeDropdown');
  dropdowns = dropdowns.concat(Array.prototype.slice.call(el.getElementsByTagName('a')));
  el = document.getElementById('toolDropdown');
  dropdowns = dropdowns.concat(Array.prototype.slice.call(el.getElementsByTagName('a')));
  el = document.getElementById('insertPageDropdown');
  dropdowns = dropdowns.concat(Array.prototype.slice.call(el.getElementsByTagName('a')));

  // I know this is confusing. Originally I had planned to use screen height,
  // but then decided to pass in the window height instead.
  var screenH = window.innerHeight + 30;
  
  // Now we will go through and adjust the size of everything so that the dropdowns appropriately use
  // the available screen real estate.
  var i = 0;
  switch (true){
  case (screenH < 720):
    
    for(i = 0; i < vButtonBarButtons.length; ++i){
      vButtonBarButtons[i].style.padding = '15px 0px 14px 16px';
    }
    
    for(i = 0; i < dropdowns.length; ++i){
      dropdowns[i].style.padding = '12px 16px';
    }
    
    document.getElementById('goBtnDivID').style.padding = '8px 0px 8px 0px';
    
    break;
  case (screenH >= 720 && screenH < 854):
    
    for(i = 0; i < vButtonBarButtons.length; ++i){
      vButtonBarButtons[i].style.padding = '20px 0px 19px 16px';
    }
    
    for(i = 0; i < dropdowns.length; ++i){
      dropdowns[i].style.padding = '17px 16px';
    }
    
    document.getElementById('goBtnDivID').style.padding = '30px 0px 8px 0px';
    
    break;
  case (screenH >= 854 && screenH < 960):
    
    for(i = 0; i < vButtonBarButtons.length; ++i){
      vButtonBarButtons[i].style.padding = '26px 0px 25px 16px';
    }
    
    for(i = 0; i < dropdowns.length; ++i){
      dropdowns[i].style.padding = '23px 16px';
    }
    
    document.getElementById('goBtnDivID').style.padding = '30px 0px 8px 0px';
    
    break;
  case (screenH >= 960):
    
    for(i = 0; i < vButtonBarButtons.length; ++i){
      vButtonBarButtons[i].style.padding = '31px 0px 30px 16px';
    }
    
    for(i = 0; i < dropdowns.length; ++i){
      dropdowns[i].style.padding = '28px 16px';
    }
    
    document.getElementById('goBtnDivID').style.padding = '30px 0px 8px 0px';
    
    break;
  default:
    break;
  }
}

function initializeGlobalVariables(){ // These have to be done after the app has had a chance to load. Otherwise they will fail.
  context = document.getElementById('canvas1').getContext('2d');
  eraserContext = document.getElementById('eraserCanvas').getContext('2d');
}

function initializeCanvas(){
  var image = new Image();
  
  // Draw image on canvas temporarily here and get dimensions before re-drawing
  image.addEventListener('load', function (){
    context.drawImage(image, 0, 0);
    eraserContext.drawImage(image, 0, 0);
    resizeAndLoadImagesOntoCanvases(image, image, image.naturalWidth, image.naturalHeight);
    arrayOfCurrentImages[currentPg - 1] = new Image();
    arrayOfCurrentImages[currentPg - 1].src = context.canvas.toDataURL('image/png');
    arrayOfOriginalImages[currentPg - 1] = new Image();
    arrayOfOriginalImages[currentPg - 1].src = eraserContext.canvas.toDataURL('image/png');
    arrayOfOriginalImagesX[0] = image.naturalWidth;
    arrayOfOriginalImagesY[0] = image.naturalHeight;
    clearUndoHistory();
    continueAfterAppFinishedLoading1();
  });
  image.src = 'images/Blank_White_Page-wide.png';
}

// *****The section below is a great place to see a basic summary of how the drawing process works*****

// Main canvas mouse down function:
function MCMDown(e){ // eslint-disable-line no-unused-vars
  instrumentDown(e.pageX - SideToolbarWidth, e.pageY - topToolbarWidth);
}

// Main canvas touch down/start function:
function MCTDown(e){ // eslint-disable-line no-unused-vars
  if(e.touches.length === 1){
    instrumentDown(e.changedTouches[0].pageX - SideToolbarWidth, e.changedTouches[0].pageY - topToolbarWidth);
    e.preventDefault();
  }
  else{
    // Here we are ignoring multi-touch. It is likely a stray elbow or something anyway, so no real reason to do anything.
    instrumentUp(prevX, prevY);
  }
}

// Main canvas mouse moved function:
function MCMMoved(e){ // eslint-disable-line no-unused-vars
  instrumentMoved(e.pageX - SideToolbarWidth, e.pageY - topToolbarWidth);
}

// Main canvas touch moved function:
function MCTMoved(e){ // eslint-disable-line no-unused-vars
  instrumentMoved(e.changedTouches[0].pageX - SideToolbarWidth, e.changedTouches[0].pageY - topToolbarWidth);
  e.preventDefault();
}

// Main canvas mouse ended function:
function MCMEnded(e){ // eslint-disable-line no-unused-vars
  instrumentUp(e.pageX - SideToolbarWidth, e.pageY - topToolbarWidth);
}

// Main canvas touch ended function:
function MCTEnded(e){ // eslint-disable-line no-unused-vars
  instrumentUp(e.changedTouches[0].pageX - SideToolbarWidth, e.changedTouches[0].pageY - topToolbarWidth);
}

// *****As the 6 functions above show, all touch/mouse/pen input from the canvas ultimately get dumped into one of 3 functions:
//      1. instrumentDown()
//      2. instrumentMoved()  or
//      3. instrumentUp().
//      From there, the input gets passed out to the appropriate tool function depending on what tool is in use*****

function setUpGUIOnStartup(){
  updateColorOfColorBtn();
  document.getElementById('toolBtn').innerHTML = 'Tool: P';
  document.getElementById('sizeBtn').innerHTML = 'Size: M';
}

// This function runs about 1/2 second after main.js finishes doing its thing and just checks to see if the user's screen size
// is within the reasonable limits for this program.
function checkForScreenSizeIssues(){
  var screenX = screen.width;
  var screenY = screen.height;
  if(screenX < 800 || screenY < 600){
    // eslint-disable-next-line max-len
    alert('Your screen resolution is too low to allow this program to display properly. A minimum screen resolution of 800 by 600 is required.', 'Error');
    ipcRenderer.send('terminate-this-app');
  }
  if(screenX > 1920 || screenY > 1080){
    // eslint-disable-next-line max-len
    alert('You are using a very high screen resolution. While this is good in most situations, it could potentially cause the following problems in the context of this program:\n\n1. The buttons/menus may be difficult to use with a touchscreen, because they appear smaller.\n\n2. If you broadcast this screen to a remote location, a higher resolution may use more bandwidth, and thus; could result in connection issues.\n\n3. If you record this screen for later viewing, a higher resolution could result in a larger file size, and may require more computing power to create/copy/move/upload, etc.\n\nIf you encounter any of these issues, consider lowering your screen resolution to something below 1920 by 1080.', 'Warning');
  }
}

// Here is the stuff that accepts keyboard input when the document has focus:
function validateKeyboardInputForDocument(e){
  if(weGotKeyboardShortcuts && e.target.nodeName === 'BODY'){
    e.preventDefault();
    passKeyboardInputOffToFunction(e);
  }
}

// Here is the stuff that accepts keyboard input when the canvas has focus:
function recieveKeyboardInputFromCanvas(e){ // eslint-disable-line no-unused-vars
  if(weGotKeyboardShortcuts){
    e.preventDefault();
    passKeyboardInputOffToFunction(e);
  }
}

// Here is the function that actually determines what to do depending on what keyboard shortcut was pressed:
function passKeyboardInputOffToFunction(e){ // eslint-disable-line max-statements
  if(typeof e === 'undefined'){
    return;
  }
  if(e.ctrlKey === true && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'z'){
    undoKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === true && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'y'){
    redoKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === true && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'c'){
    copyKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === true && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'v'){
    pasteKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === true && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 's'){
    saveKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === true && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'a'){
    selectAllKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === true && e.altKey === false && e.shiftKey === true && e.metaKey === false && e.key === 'A'){
    deselectAllKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'p'){
    penKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'e'){
    eraserKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'l'){
    lineKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 's'){
    selectKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'i'){
    identifierKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'd'){
    dotKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'b'){
    blueKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'k'){
    blackKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'w'){
    whiteKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'r'){
    redKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'g'){
    greenKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === ' '){
    nextPageKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === true && e.metaKey === false && e.key === ' '){
    previousPageKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'Escape'){
    escapeKeyboardShortcutPressed();
    return;
  }
  if(e.ctrlKey === false && e.altKey === false && e.shiftKey === false && e.metaKey === false && e.key === 'Delete'){
    deleteKeyboardShortcutPressed();
    return;
  }
}

// The next several functions simply perform the applicable tasks when the respective keyboard shortcut is pressed:
function undoKeyboardShortcutPressed(){
  if(canUseTool === false){
    undoBtnFunction();
  }
}

function redoKeyboardShortcutPressed(){
  if(canUseTool === false){
    redoBtnFunction();
  }
}

function copyKeyboardShortcutPressed(){
  if(canUseTool === false){
    copyBtnFunction();
  }
}

function pasteKeyboardShortcutPressed(){
  if(canUseTool === false){
    cancelSelect();
    pasteBtnFunction();
  }
}

function saveKeyboardShortcutPressed(){
  document.getElementById('saveImagesBtn').click();
}

function selectAllKeyboardShortcutPressed(){
  // The purpose of this function is to select the entire drawing area.
  cancelSelect();
  if(canUseTool === false){
    tool = 'select';
    updateTextOfToolBtn();
    prevX = context.canvas.width;
    prevY = context.canvas.height;
    tempX = 0;
    tempY = 0;
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    
    areaSelected = true;
    context.strokeStyle = 'rgba(0, 0, 0, 1.0)';
    context.lineJoin = 'round';
    context.lineWidth = 1;
    context.beginPath();
    // These have to be 1 back from the edges of the canvas so they will be visible.
    context.moveTo(tempX + 1, tempY + 1);
    context.lineTo(prevX - 1, tempY + 1);
    context.lineTo(prevX - 1, prevY - 1);
    context.lineTo(tempX + 1, prevY - 1);
    context.closePath();
    context.stroke();
    
    var tempWidth = Math.abs(tempX - prevX);
    var tempHeight = Math.abs(tempY - prevY);
    if(tempWidth === 0 || tempHeight === 0){
      cancelSelect();
    }
  }
}

function deselectAllKeyboardShortcutPressed(){
  cancelSelect();
}

function penKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    tool = 'pen';
    updateTextOfToolBtn();
  }
}

function eraserKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    tool = 'eraser';
    updateTextOfToolBtn();
  }
}

function lineKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    tool = 'line';
    updateTextOfToolBtn();
  }
}

function selectKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    tool = 'select';
    updateTextOfToolBtn();
  }
}

function identifierKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    tool = 'identify';
    updateTextOfToolBtn();
  }
}

function dotKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    tool = 'dot';
    updateTextOfToolBtn();
  }
}

function blueKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    instrumentColor = 'rgba(78, 78, 255, 1.0)';
    updateColorOfColorBtn();
  }
}

function blackKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    instrumentColor = 'rgba(0, 0, 0, 1.0)';
    updateColorOfColorBtn();
  }
}

function whiteKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    instrumentColor = 'rgba(255, 255, 255, 1.0)';
    updateColorOfColorBtn();
  }
}

function redKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    instrumentColor = 'rgba(255, 0, 0, 1.0)';
    updateColorOfColorBtn();
  }
}

function greenKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    instrumentColor = 'rgba(0, 109, 0, 1.0)';
    updateColorOfColorBtn();
  }
}

function nextPageKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    nextPageBtnFunction();
  }
}

function previousPageKeyboardShortcutPressed(){
  cancelSelect();
  if(canUseTool === false){
    previousPageBtnFunction();
  }
}

function escapeKeyboardShortcutPressed(){
  // If they press escape, then we should simply cancel whatever it was that they were doing, & paint the
  // temporary canvas on the drawing area.
  cancelSelect();
  if(canUseTool){
    if(tool === 'line' || 
    tool === 'select' || 
    tool === 'text' || 
    tool === 'identify' || 
    tool === 'dot' || 
    tool === 'PASTE' || 
    tool === 'PASTE-S' ||
    tool === 'central-line' || 
    tool === 'dashed-line' || 
    tool === 'dashed-central-line'){
      // Paint the temporary canvas onto the the real canvas:
      context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
      // Disable the tool:
      canUseTool = false;
      // Do some cleanup:
      prevX = 'NA';
      prevY = 'NA';
      tempX = 'NA';
      tempY = 'NA';
      areaSelected = false;
    }
  }
}


function deleteKeyboardShortcutPressed(){
  // If delete is pressed, then we will erase the entire area that is selected.
  // Unless they haven't selected anything, in which case we will tell them to select something.
  if(canUseTool === false){
    if(areaSelected === true){
      context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
      var sx = Math.min(tempX, prevX);
      var sy = Math.min(tempY, prevY);
      var lx = Math.max(tempX, prevX);
      var ly = Math.max(tempY, prevY);
      var tempImageData = eraserContext.getImageData(sx, sy, lx - sx, ly - sy);
      context.putImageData(tempImageData, sx, sy);
      prevX = 'NA';
      prevY = 'NA';
      tempX = 'NA';
      tempY = 'NA';
      areaSelected = false;
      pushStateIntoUndoArray();
    }
    else{
      tellUserToSelectAnAreaFirst();
    }
  }
}

// Here is the instrumentDown function. It accepts the x and y coordinates of where the tool/instrument started
// touching the main canvas. It then calls other functions that correspond
// to the applicable tools that are available.
function instrumentDown(x, y){
  tempImageForWindowResize = null;
  
  // Obviously we want to close the dropdowns regardless of what tool is active.
  closeDropdowns();
  
  // And obviously, we can do things with our tool now:
  canUseTool = true;
  // Now let's pass the event off to the applicable function:
  switch(tool){
  case 'pen':
    penToolFunction(x, y, 'down');
    break;
  case 'eraser':
    eraserToolFunction(x, y, 'down');
    break;
  case 'line':
    lineToolFunction(x, y, 'down');
    break;
  case 'select':
    selectToolFunction(x, y, 'down');
    break;
  case 'text':
    textToolFunction(x, y, 'down');
    break;
  case 'identify':
    identifyToolFunction(x, y, 'down');
    break;
  case 'dot':
    dotToolFunction(x, y, 'down');
    break;
  case 'PASTE':
    pasteToolFunction(x, y, 'down');
    break;
  case 'central-line':
    centralLineToolFunction(x, y, 'down');
    break;
  case 'dashed-line':
    dashedLineToolFunction(x, y, 'down');
    break;
  case 'dashed-central-line':
    dashedCentralLineToolFunction(x, y, 'down');
    break;
  case 'PASTE-S':
    scaledPasteToolFunction(x, y, 'down');
    break;
  case 'NA':
    break;
  default:
    throw new Error('Invalid tool in instrumentDown function: ' + tool);
  }
}

// Here is the instrumentMoved function, which runs every time our tool/instrument is moved. It passes
// the event off to the applicable which then handles it appropriately.
function instrumentMoved(x, y){
  if(canUseTool){ // Note: This validation is critical here. Make sure to put future function calls inside of this if structure.
    // Now let's pass the event off to the applicable function:
    switch(tool){
    case 'pen':
      penToolFunction(x, y, 'move');
      break;
    case 'eraser':
      eraserToolFunction(x, y, 'move');
      break;
    case 'line':
      lineToolFunction(x, y, 'move');
      break;
    case 'select':
      selectToolFunction(x, y, 'move');
      break;
    case 'text':
      textToolFunction(x, y, 'move');
      break;
    case 'identify':
      identifyToolFunction(x, y, 'move');
      break;
    case 'dot':
      dotToolFunction(x, y, 'move');
      break;
    case 'PASTE':
      pasteToolFunction(x, y, 'move');
      break;
    case 'central-line':
      centralLineToolFunction(x, y, 'move');
      break;
    case 'dashed-line':
      dashedLineToolFunction(x, y, 'move');
      break;
    case 'dashed-central-line':
      dashedCentralLineToolFunction(x, y, 'move');
      break;
    case 'PASTE-S':
      scaledPasteToolFunction(x, y, 'move');
      break;
    case 'NA':
      break;
    default:
      if(typeof tool !== 'undefined'){ 
        // This validation should help to reduce unnecessary error logs & help debugging.
        // That way, if/when things go south, we are more likely to find the root of the
        // problem instead of being overloaded by an error message for every mouse move.
        throw new Error('Invalid tool in instrumentMoved function: ' + tool);
      }
    }
  }
}

// Here is the instrumentUp function. This runs every time our tool is picked up off of the page, leaves
// the drawing area, or is canceled by multiple touches on the screen at once. Here again, this function calls
// multiple other functions for the applicable tools, which then handle the event in the appropriate manner.
function instrumentUp(x, y){
  if(canUseTool){ // Here again, this validation is critical. All future function calls must go inside this if structure
    // Now let's pass the event off to the applicable function:
    switch(tool){
    case 'pen':
      penToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'eraser':
      eraserToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'line':
      lineToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'select':
      selectToolFunction(x, y, 'up');
      break;
    case 'text':
      textToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'identify':
      identifyToolFunction(x, y, 'up');
      break;
    case 'dot':
      dotToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'PASTE':
      pasteToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'central-line':
      centralLineToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'dashed-line':
      dashedLineToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'dashed-central-line':
      dashedCentralLineToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'PASTE-S':
      scaledPasteToolFunction(x, y, 'up');
      pushStateIntoUndoArray();
      break;
    case 'NA':
      break;
    default:
      throw new Error('Invalid tool in instrumentUp function: ' + tool);
    }
  }
  
  // Although it may seem counter-intuitive to have this OUTSIDE the validation, I wanted to make sure that 
  // regardless of whether the tool can be used or not; if this function is called, we need to make absolutely
  // sure that more drawing/action CANNOT take place. Remember, this may be called on multi-touch, so we
  // don't want stray lines appearing where they were not intended.
  canUseTool = false;
}

// Here are the functions that actually do the action that each tool needs to do. I have put them in the
// same order that they are in the tool dropdown with the extras below that:

// Here is the penToolFunction. It handles drawing on the canvas:
// Note that if the color is not transparent we will connect the dots.
// However if the color is transparent, we will not connect them to
// reduce the transparency overlap.
function penToolFunction(x, y, phase){
  var temp1 = instrumentColor.split(',');
  var temp2 = temp1[3].substring(1, (temp1[3].length - 1));
  var colorNotTransparent;
  if(temp2 === '1.0' || temp2 === '1'){
    colorNotTransparent = true;
  }
  else{
    colorNotTransparent = false;
  }
  switch(phase){
  case 'down':
    
    // These make sense here, because this is the start of drawing, so this point is really only significant
    // as the start of the line drawn when the instrument is moved.
    prevX = x;
    prevY = y;
    
    break;
  case 'move':
    
    context.strokeStyle = instrumentColor;
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    
    if(colorNotTransparent){
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.stroke();
    }
    
    context.beginPath();
    context.arc(x, y, (instrumentWidth - 0.3) / 2, 0, 2 * Math.PI, false);
    context.fillStyle = instrumentColor;
    context.fill();
    
    // And of course, the coordinates of the end of this movement need to become the coordinates of the
    // beginning of the next action.
    prevX = x;
    prevY = y;
    
    break;
  case 'up':
    
    context.strokeStyle = instrumentColor;
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    
    if(colorNotTransparent){
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.stroke();
    }
    
    context.beginPath();
    context.arc(x, y, instrumentWidth / 2, 0, 2 * Math.PI, false);
    context.fillStyle = instrumentColor;
    context.fill();

    prevX = 'NA';
    prevY = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in penToolFunction: ' + phase);
  }
}

// Here is the eraserToolFunction. It handles erasing areas of the canvas:
function eraserToolFunction(x, y, phase){
  if(phase === 'down' || phase === 'move' || phase === 'up'){
    // 1. grab section of original image under mouse, 2. draw it over the canvas where it belongs.
    var ofset = Math.pow(instrumentWidth, 2);
    var halfSmallerDimention = parseInt(Math.min(context.canvas.width, context.canvas.height) / 2, 10);
    if(ofset > halfSmallerDimention){
      ofset = halfSmallerDimention;
    }
    var tempImageData = eraserContext.getImageData(x - ofset, y - ofset, 2 * ofset, 2 * ofset);
    context.putImageData(tempImageData, x - ofset, y - ofset);
  }
  else{
    throw new Error('Invalid phase in eraserToolFunction: ' + phase);
  }
}

// Here is the lineToolFunction. It handles drawing straight lines on the canvas:
function lineToolFunction(x, y, phase){
  switch(phase){
  case 'down':
    
    //      1. save current canvas into tempCanvasForInterval.
    //      2. save x & y into both the variables that store the start point & the ones that store the current position.
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    prevX = x;
    prevY = y;
    tempX = x;
    tempY = y;
    
    break;
  case 'move':
    
    // 1. Update the current position variables with the current values of x & y.
    // 2. repaint the tempCanvasForInterval onto the real canvas.
    // 3. paint an opaque gray line of set size onto the canvas between the starting point & current position.
    prevX = x;
    prevY = y;
    
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    
    context.strokeStyle = 'rgba(137, 137, 137, 0.6)';
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.beginPath();
    context.moveTo(tempX, tempY);
    context.lineTo(prevX, prevY);
    context.stroke();
    
    break;
  case 'up':
    
    //      1. Paint tempCanvasForInterval onto the real canvas.
    //      2. draw line on real canvas using instrumentColor and instrumentWidth.
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.strokeStyle = instrumentColor;
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.beginPath();
    context.moveTo(tempX, tempY);
    context.lineTo(prevX, prevY);
    context.stroke();
    tempCanvasForInterval = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in lineToolFunction: ' + phase);
  }
}

// Here is the selectToolFunction. It handles selecting areas of the canvas:
function selectToolFunction(x, y, phase){
  switch(phase){
  case 'down':
    
    //      1. call cancelSelect(); if there is already an area selected.
    //      2. save x & y into tempX, tempY, prevX & prevY.
    //      3. save canvas into tempCanvasForInterval.
    cancelSelect();
    prevX = x;
    prevY = y;
    tempX = x;
    tempY = y;
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    
    break;
  case 'move':
    
    // 1. Update prevX & prevY with the current values of x & y.
    // 2. repaint the tempCanvasForInterval onto the real canvas.
    // 3. paint 4 opaque gray lines of set size onto the canvas between the tempX, tempY; and prevX, prevY.
    prevX = x;
    prevY = y;
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.strokeStyle = 'rgba(0, 0, 0, 1.0)';
    if(useColorInvertedTemplates){
      context.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    }
    context.lineJoin = 'round';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(tempX, tempY);
    context.lineTo(prevX, tempY);
    context.lineTo(prevX, prevY);
    context.lineTo(tempX, prevY);
    context.closePath();
    context.stroke();
    
    break;
  case 'up':
    
    //      1. Paint tempCanvasForInterval onto the real canvas.
    //      2. draw 4 opaque gray lines of set size onto the canvas between the tempX, tempY; and prevX, prevY.
    //      3. set areaSelected to true, and keep the values in tempCanvasForInterval, tempX, tempY; and prevX, prevY.
    //      4. Calculate width & height of area selected. If either of them are 0, call cancelSelect.
    areaSelected = true;
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.strokeStyle = 'rgba(0, 0, 0, 1.0)';
    if(useColorInvertedTemplates){
      context.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    }
    context.lineJoin = 'round';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(tempX, tempY);
    context.lineTo(prevX, tempY);
    context.lineTo(prevX, prevY);
    context.lineTo(tempX, prevY);
    context.closePath();
    context.stroke();
    
    var tempWidth = Math.abs(tempX - prevX);
    var tempHeight = Math.abs(tempY - prevY);
    if(tempWidth === 0 || tempHeight === 0){
      cancelSelect();
    }
    
    
    break;
  default:
    throw new Error('Invalid phase in selectToolFunction: ' + phase);
  }
}

// Here is the textToolFunction. It handles inserting text onto the canvas:
function textToolFunction(x, y, phase){
  switch(phase){
  case 'down':
    
    //      1. save current canvas into tempCanvasForInterval.
    //      2. save x & y into prevX & prevY.
    //      3. draw the first piece of text where it belongs.
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    prevX = x;
    prevY = y;
    
    context.font = (instrumentWidth + 8) + 'px sans-serif';
    context.fillStyle = instrumentColor;
    context.fillText(textToInsert, prevX, prevY);
    
    break;
  case 'move':
    
    // Update prevX & prevY with the current values of x & y.
    // Paint the temporary canvas onto the the real canvas:
    // Draw the text:
    prevX = x;
    prevY = y;
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.font = (instrumentWidth + 8) + 'px sans-serif';
    context.fillStyle = instrumentColor;
    context.fillText(textToInsert, prevX, prevY);
        
    break;
  case 'up':
    
    //      1. Paint tempCanvasForInterval onto the real canvas.
    //      2. paint the text onto the canvas at prevX, prevY.
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.font = (instrumentWidth + 8) + 'px sans-serif';
    context.fillStyle = instrumentColor;
    context.fillText(textToInsert, prevX, prevY);
    tempCanvasForInterval = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in textToolFunction: ' + phase);
  }
}

// Here is the identifyToolFunction. It handles identifying areas of the canvas:
function identifyToolFunction(x, y, phase){
  switch(phase){
  case 'down':
    
    //      1. save current canvas into tempCanvasForInterval.
    //      2. save x & y into prevX & prevY.
    //      3. Draw a dot where the mouse went down
    
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    prevX = x;
    prevY = y;
    context.beginPath();
    context.arc(prevX, prevY, (instrumentWidth + 8) / 2, 0, 2 * Math.PI, false);
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    if(useColorInvertedTemplates){
      context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    }
    context.fill();
    
    break;
  case 'move':
    
    // 1. Update prevX & prevY with the current values of x & y.
    // 2. repaint the tempCanvasForInterval onto the real canvas.
    // 3. paint a dot using fixed color & InstrumentWidth onto the canvas at prevX, prevY.
    prevX = x;
    prevY = y;
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.beginPath();
    context.arc(prevX, prevY, (instrumentWidth + 8) / 2, 0, 2 * Math.PI, false);
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    if(useColorInvertedTemplates){
      context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    }
    context.fill();
    
    break;
  case 'up':
    
    //      Paint tempCanvasForInterval onto the real canvas.
    
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    tempCanvasForInterval = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in identifierToolFunction: ' + phase);
  }
}

// Here is the dotToolFunction. It handles putting a dot onto the canvas:
function dotToolFunction(x, y, phase){
  switch(phase){
  case 'down':
    
    //      1. save current canvas into tempCanvasForInterval.
    //      2. save x & y into prevX & prevY.
    //      3. paint a dot on the canvas where the mouse went down
    
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    prevX = x;
    prevY = y;
    context.beginPath();
    context.arc(prevX, prevY, (instrumentWidth + 8) / 2, 0, 2 * Math.PI, false);
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    if(useColorInvertedTemplates){
      context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    }
    context.fill();
    
    break;
  case 'move':
    
    // 1. Update prevX & prevY with the current values of x & y.
    // 2. repaint the tempCanvasForInterval onto the real canvas.
    // 3. paint a dot using fixed color & InstrumentWidth onto the canvas at prevX, prevY.
    prevX = x;
    prevY = y;
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.beginPath();
    context.arc(prevX, prevY, (instrumentWidth + 8) / 2, 0, 2 * Math.PI, false);
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    if(useColorInvertedTemplates){
      context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    }
    context.fill();
    
    break;
  case 'up':
    
    //      1. Paint tempCanvasForInterval onto the real canvas.
    //      2. put a dot at prevX, prevY using instrumentColor.
    
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.beginPath();
    context.arc(prevX, prevY, (instrumentWidth + 8) / 2, 0, 2 * Math.PI, false);
    context.fillStyle = instrumentColor;
    context.fill();
    tempCanvasForInterval = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in dotToolFunction: ' + phase);
  }
}

// Here is the pasteToolFunction. It handles pasting onto the canvas:
function pasteToolFunction(x, y, phase){
  if(copiedSectionOfCanvas !== 'NA'){
    switch(phase){
    case 'down':
      
      //      1. save current canvas into tempCanvasForInterval.
      //      2. save x & y into prevX & prevY.
      //      3. Put the copied section on the canvas where the mouse went down.
      
      tempCanvasForInterval = 'NA';
      tempCanvasForInterval = new Image();
      tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
      prevX = x;
      prevY = y;
      tempX = x;
      tempY = y;
      context.putImageData(copiedSectionOfCanvas, prevX, (prevY - copiedSectionOfCanvas.height));
      
      break;
    case 'move':
      
      // 1. Update prevX & prevY with the current values of x & y.
      // 2. repaint the tempCanvasForInterval onto the real canvas.
      // 3. paint the image in copiedSectionOfCanvas onto the canvas at prevX, prevY.
      prevX = x;
      prevY = y;
      context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
      context.putImageData(copiedSectionOfCanvas, prevX, (prevY - copiedSectionOfCanvas.height));
      
      break;
    case 'up':
      
      //      1. Paint tempCanvasForInterval onto the real canvas.
      //      2. paint the image in tempCanvasForPasting onto the canvas at prevX, prevY.
      context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
      context.putImageData(copiedSectionOfCanvas, prevX, (prevY - copiedSectionOfCanvas.height));
      tempCanvasForInterval = 'NA';
      
      break;
    default:
      throw new Error('Invalid phase in pasteToolFunction: ' + phase);
    }
  }
}

// Here is the centralLineToolFunction. 
// It handles creating a line centered when the instrument went down:
function centralLineToolFunction(x, y, phase){
  var nx;
  var ny;
  switch(phase){
  case 'down':
    
    //      1. save current canvas into tempCanvasForInterval.
    //      2. save x & y into both the variables that store the start point & the ones that store the current position.
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    prevX = x;
    prevY = y;
    tempX = x;
    tempY = y;
    
    break;
  case 'move':
    
    // 1. Update the current position variables with the current values of x & y.
    // 2. repaint the tempCanvasForInterval onto the real canvas.
    // 3. paint an opaque gray line of set size onto the canvas between the starting point & current position.
    prevX = x;
    prevY = y;
    
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    
    context.strokeStyle = 'rgba(137, 137, 137, 0.6)';
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.beginPath();
    nx = tempX + (tempX - prevX);
    ny = tempY + (tempY - prevY);
    context.moveTo(nx, ny);
    context.lineTo(prevX, prevY);
    context.stroke();
    
    break;
  case 'up':
    
    //      1. Paint tempCanvasForInterval onto the real canvas.
    //      2. draw line on real canvas using instrumentColor and instrumentWidth.
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.strokeStyle = instrumentColor;
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.beginPath();
    nx = tempX + (tempX - prevX);
    ny = tempY + (tempY - prevY);
    context.moveTo(nx, ny);
    context.lineTo(prevX, prevY);
    context.stroke();
    tempCanvasForInterval = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in centralLineToolFunction: ' + phase);
  }
}

// Here is the dashedLineToolFunction. It handles creating a dashed line on the canvas:
function dashedLineToolFunction(x, y, phase){
  switch(phase){
  case 'down':
    
    //      1. save current canvas into tempCanvasForInterval.
    //      2. save x & y into both the variables that store the start point & the ones that store the current position.
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    prevX = x;
    prevY = y;
    tempX = x;
    tempY = y;
    
    break;
  case 'move':
    
    // 1. Update the current position variables with the current values of x & y.
    // 2. repaint the tempCanvasForInterval onto the real canvas.
    // 3. paint an opaque gray line onto the canvas between the starting point & current position.
    prevX = x;
    prevY = y;
    
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    
    context.strokeStyle = 'rgba(137, 137, 137, 0.6)';
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.setLineDash([10, 3]);
    context.beginPath();
    context.moveTo(tempX, tempY);
    context.lineTo(prevX, prevY);
    context.stroke();
    context.setLineDash([]);
    
    break;
  case 'up':
    
    //      1. Paint tempCanvasForInterval onto the real canvas.
    //      2. draw line on real canvas using instrumentColor and instrumentWidth.
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.strokeStyle = instrumentColor;
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.setLineDash([10, 3]);
    context.beginPath();
    context.moveTo(tempX, tempY);
    context.lineTo(prevX, prevY);
    context.stroke();
    context.setLineDash([]);
    tempCanvasForInterval = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in centralLineToolFunction: ' + phase);
  }
}

// Here is the dashedCentralLineToolFunction. It handles creating a dashed line
// centered where the instrument went down:
function dashedCentralLineToolFunction(x, y, phase){
  var nx;
  var ny;
  switch(phase){
  case 'down':
    
    //      1. save current canvas into tempCanvasForInterval.
    //      2. save x & y into both the variables that store the start point & the ones that store the current position.
    tempCanvasForInterval = 'NA';
    tempCanvasForInterval = new Image();
    tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
    prevX = x;
    prevY = y;
    tempX = x;
    tempY = y;
    
    break;
  case 'move':
    
    // 1. Update the current position variables with the current values of x & y.
    // 2. repaint the tempCanvasForInterval onto the real canvas.
    // 3. paint an opaque gray line of set size onto the canvas between the starting point & current position.
    prevX = x;
    prevY = y;
    
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    
    context.strokeStyle = 'rgba(137, 137, 137, 0.6)';
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.setLineDash([10, 3]);
    context.beginPath();
    nx = tempX + (tempX - prevX);
    ny = tempY + (tempY - prevY);
    context.moveTo(nx, ny);
    context.lineTo(prevX, prevY);
    context.stroke();
    context.setLineDash([]);
    
    break;
  case 'up':
    
    //      1. Paint tempCanvasForInterval onto the real canvas.
    //      2. draw line on real canvas using instrumentColor and instrumentWidth.
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    context.strokeStyle = instrumentColor;
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.setLineDash([10, 3]);
    context.beginPath();
    nx = tempX + (tempX - prevX);
    ny = tempY + (tempY - prevY);
    context.moveTo(nx, ny);
    context.lineTo(prevX, prevY);
    context.stroke();
    context.setLineDash([]);
    tempCanvasForInterval = 'NA';
    
    break;
  default:
    throw new Error('Invalid phase in centralLineToolFunction: ' + phase);
  }
}

// Here is the scaledPasteToolFunction. It handles pasting scaled images onto the canvas:
function scaledPasteToolFunction(x, y, phase){
  if(copiedSectionOfCanvasForScale !== 'NA'){
    switch(phase){
    case 'down':
      
      //      1. save current canvas into tempCanvasForInterval.
      //      2. save x & y into prevX & prevY.
      //      3. Put the copied section on the canvas where the mouse went down.
      
      tempCanvasForInterval = 'NA';
      tempCanvasForInterval = new Image();
      tempCanvasForInterval.src = context.canvas.toDataURL('image/png');
      prevX = x;
      prevY = y;
      tempX = x;
      tempY = y;
      context.putImageData(copiedSectionOfCanvasForScale, prevX, (prevY - copiedSectionOfCanvasForScale.height));
      
      break;
    case 'move':
      
      // 1. Update prevX & prevY with the current values of x & y.
      // 2. repaint the tempCanvasForInterval onto the real canvas.
      // 3. paint the image in copiedSectionOfCanvasForScale onto the canvas at prevX, prevY.
      prevX = x;
      prevY = y;
      context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
      context.putImageData(copiedSectionOfCanvasForScale, prevX, (prevY - copiedSectionOfCanvasForScale.height));
      
      break;
    case 'up':
      
      //      1. Paint tempCanvasForInterval onto the real canvas.
      //      2. paint the image in copiedSectionOfCanvasForScale onto the canvas at prevX, prevY.
      context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
      context.putImageData(copiedSectionOfCanvasForScale, prevX, (prevY - copiedSectionOfCanvasForScale.height));
      tempCanvasForInterval = 'NA';
      
      break;
    default:
      throw new Error('Invalid phase in scaledPasteToolFunction: ' + phase);
    }
  }
}

// Here is the function that executes every time the window resize event is fired:
function onWindowResize(){
  // First clear the timer, (Remember, if the user is dragging the edge, we only want to fix the image once.)
  clearTimeout(tempForTimer);
  // Then set the timer for half a second, so that the re-sizing is not happening continuously:
  tempForTimer = setTimeout(fixThingsAfterRezizeIsDone, 500);
}

// Here is the function the executes half a second after the user has finished re-sizing the window:
function fixThingsAfterRezizeIsDone(){
  cancelSelect();
  if(allLoaded){
    if(tempImageForWindowResize === null || typeof tempImageForWindowResize === 'undefined'){
      tempImageForWindowResize = new Image();
      tempImageForWindowResize.src = context.canvas.toDataURL('image/png');
      resizeAndLoadImagesOntoCanvases(tempImageForWindowResize, arrayOfOriginalImages[currentPg - 1],
      tempImageForWindowResize.naturalWidth, tempImageForWindowResize.naturalHeight);
      adjustSizeOfMenuButtonsToScreenSize();
    }
    else{
      resizeAndLoadImagesOntoCanvases(tempImageForWindowResize, arrayOfOriginalImages[currentPg - 1],
      tempImageForWindowResize.naturalWidth, tempImageForWindowResize.naturalHeight);
      adjustSizeOfMenuButtonsToScreenSize();
    }
  }
}

// If the user clicks on a blank area of the window, the dropdowns should probably close:
window.onclick = function (e){
  if (!e.target.matches('.dropbtn')){
    closeDropdowns();
  }
  
  // And if they don't click on one of a few select buttons, we should cancel select.
  var id = e.target.id;
  if(id !== 'canvas1' && id !== 'copyBtn' && id !== 'drawRectangleBtn' && id !== 'fillRectangleBtn' &&
  id !== 'drawEllipseBtn' && id !== 'fillEllipseBtn' && id !== 'topRightMinimizeBtn'){
    cancelSelect();
  }
  
  // And if they haven't clicked on the page text box or the go button, let's update the page number.
  if(id !== 'pageTextBoxID' && id !== 'goBtnID'){
    updatePageNumsOnGui();
  }
};

// Closes all the other dropdowns except for the one with the name passed in.
function closeDropdowns(buttonName){
  var dropdowns = document.getElementsByClassName('dropdown-content');
  for (var d = 0; d < dropdowns.length; d++){
    var openDropdown = dropdowns[d];
    if (openDropdown.classList.contains('show')){
      if(openDropdown.id.toString() !== buttonName){
        openDropdown.classList.remove('show');
      }
    }
  }
}

// Here are all of the functions that execute whenever the applicable button on the side bar is clicked or tapped.
// Essentially, they just reveal or hide the applicable dropdown:
function fileBtnFunction(){ // eslint-disable-line no-unused-vars
  closeDropdowns('fileDropdown');
  document.getElementById('fileDropdown').classList.toggle('show');
}

function toolBtnFunction(){ // eslint-disable-line no-unused-vars
  closeDropdowns('toolDropdown');
  document.getElementById('toolDropdown').classList.toggle('show');
}

function colorBtnFunction(){ // eslint-disable-line no-unused-vars
  closeDropdowns('colorDropdown');
  document.getElementById('colorDropdown').classList.toggle('show');
}

function sizeBtnFunction(){ // eslint-disable-line no-unused-vars
  closeDropdowns('sizeDropdown');
  document.getElementById('sizeDropdown').classList.toggle('show');
}

function insertPageBtnFunction(){ // eslint-disable-line no-unused-vars
  closeDropdowns('insertPageDropdown');
  document.getElementById('insertPageDropdown').classList.toggle('show');
}


// Here is the function that takes care of scaling the image/drawing area in the optimal way, given the
// size of the window.
function resizeAndLoadImagesOntoCanvases(img, orgImg, incommingWidth, incommingHeight){
  if(incommingWidth === 0 || incommingHeight === 0 || typeof incommingWidth === 'undefined' ||
  typeof incommingHeight === 'undefined' || incommingWidth === null || incommingHeight === null){
    throw new Error('resizeAndLoadImagesOntoCanvases has been called before the image has loaded!');
  }
  
  eraserContext.canvas.style.position = 'absolute';
  eraserContext.canvas.style.left = SideToolbarWidth + 'px';
  eraserContext.canvas.style.top = (screen.height + topToolbarWidth) + 'px';

  // Maybe there is a better way to do this than fixed positioning in the CSS.
  // However, for now, we will do it this way:
  var avalibleWidth = window.innerWidth - SideToolbarWidth;
  var avalibleHeight = window.innerHeight - topToolbarWidth;
  var canvasHeight;
  var canvasWidth;
  
  var proportionalHeight = (incommingHeight * avalibleWidth) / incommingWidth;
  if(proportionalHeight > window.innerHeight - topToolbarWidth){
    // this means height is limiting dimension.
    canvasHeight = avalibleHeight;
    canvasWidth = (incommingWidth * avalibleHeight) / incommingHeight;
    canvasWidth = Math.round(canvasWidth);   // Without this line the image width is potentially reduced by 1 pixel every repaint.
    context.canvas.width = canvasWidth;
    context.canvas.height = canvasHeight;
    context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    eraserContext.canvas.width = canvasWidth;
    eraserContext.canvas.height = canvasHeight;
    eraserContext.drawImage(orgImg, 0, 0, canvasWidth, canvasHeight);
  }
  else  { // this means width is limiting dimension.
    canvasWidth = avalibleWidth;
    canvasHeight = (incommingHeight * avalibleWidth) / incommingWidth;
    canvasHeight = Math.round(canvasHeight);// Without this line the image height is potentially reduced by 1 pixel every repaint.
    context.canvas.width = canvasWidth;
    context.canvas.height = canvasHeight;
    context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    eraserContext.canvas.width = canvasWidth;
    eraserContext.canvas.height = canvasHeight;
    eraserContext.drawImage(orgImg, 0, 0, canvasWidth, canvasHeight);
  }
}


// Here is the code related to inserting/removing pages:
function loadPage(numberOfPageToLoad){
  // load the page that was passed in.
  saveCurrentImageToArrayBeforeMoving();
  currentPg = numberOfPageToLoad;
  resizeAndLoadImagesOntoCanvases(arrayOfCurrentImages[currentPg - 1], arrayOfOriginalImages[currentPg - 1],
  arrayOfOriginalImagesX[currentPg - 1], arrayOfOriginalImagesY[currentPg - 1]);
  updatePageNumsOnGui();
  clearUndoHistory();
}

// Here is the function that executes when the user wants to insert a template from one of the 
// ones on the main dropdown. Take note of the naming convention used to differentiate
// between normal templates and widescreen, & inverted color templates.
function mainUIInsertTemplateAsPage(location){ // eslint-disable-line no-unused-vars
  var before = location.substring(0, (location.length - 4));
  if(useWidescreenTemplates){
    before += '-wide';
  }
  if(useColorInvertedTemplates){
    before += '-b';
  }
  before += '.png';
  insertTemplateAsPage(before);
}

// This function simply loads a template in from an image and then passes the image off to the function that inserts
// pages using images:
function insertTemplateAsPage(locationOfTemplate){
  // Get the image from the string that was passed in, then call insertPageUsingImage() and pass in the image.
  var tempImageForInserting = new Image();
  tempImageForInserting.addEventListener('load', function (){
    insertPageUsingImage(tempImageForInserting);
  });
  tempImageForInserting.src = locationOfTemplate;
}

// This function inserts a page using an image unless the user has exceeded the pages maximum.
function insertPageUsingImage(img){
  // load the image onto the screen, then into the pages arrays.
  if(arrayOfCurrentImages.length < maxNumberOfPages){
    tempImageForWindowResize = null;
    saveCurrentImageToArrayBeforeMoving();
    context.drawImage(img, 0, 0);
    eraserContext.drawImage(img, 0, 0);
    resizeAndLoadImagesOntoCanvases(img, img, img.naturalWidth, img.naturalHeight);
    var tempImageForInserting = new Image();
    tempImageForInserting.src = context.canvas.toDataURL('image/png');
    arrayOfCurrentImages.splice(currentPg, 0, tempImageForInserting);
    
    tempImageForInserting.src = eraserContext.canvas.toDataURL('image/png');
    arrayOfOriginalImages.splice(currentPg, 0, tempImageForInserting);
    arrayOfOriginalImagesX.splice(currentPg, 0, img.naturalWidth);
    arrayOfOriginalImagesY.splice(currentPg, 0, img.naturalHeight);
    currentPg++;
    updatePageNumsOnGui();
    clearUndoHistory();
  }
  else{
    tellUserTheyHaveExcededMaxPages();
  }
}

// This function simply updates the entry in the pages array with the latest image on the canvas
function saveCurrentImageToArrayBeforeMoving(){
  var tempImageForInserting = new Image();
  tempImageForInserting.src = context.canvas.toDataURL('image/png');
  arrayOfCurrentImages[currentPg - 1] = tempImageForInserting;
}

function tellUserTheyHaveExcededMaxPages(){
  // Here we explain why they can't insert another page:
  // eslint-disable-next-line max-len
  alert('Sorry, The document can only have up to ' +  maxNumberOfPages + ' pages.\nThis leaves you with essentially two options:\n\n1. Save this set of pages and then open another set.\n2. Adjust the "Max Pages Allowed" value in the settings to allow more pages to be inserted.\n\nRegardless of which option you choose, please remember that few audiences can absorb ' + maxNumberOfPages + ' slides in a single sitting. Thus, consider giving them a short break between sets if possible.');
}

// Updates the page numbers on the main user interface:
function updatePageNumsOnGui(){
  var box = document.getElementById('pageTextBoxID');
  box.value = currentPg;
  box.style.backgroundColor = 'white';
  box.setAttribute('max', arrayOfCurrentImages.length);
  document.getElementById('totalPagesDivID').innerHTML = 'Total Pages: ' + arrayOfCurrentImages.length;
}

// Sanitizing the input from the page text box and changing the color of the box as appropriate:
function pageInputBoxValidator(){ // eslint-disable-line no-unused-vars
  var input = document.getElementById('pageTextBoxID').value;
  var tempNum = parseInt(input, 10);
  if(isNaN(tempNum) || tempNum > arrayOfCurrentImages.length || tempNum < 1){
    document.getElementById('pageTextBoxID').style.backgroundColor = 'red';
  }
  else{
    if(tempNum !== currentPg){
      document.getElementById('pageTextBoxID').style.backgroundColor = 'yellow';
    }
    else{
      document.getElementById('pageTextBoxID').style.backgroundColor = 'white';
    }
  }
}

// If they hit enter in the page text box the page should probably change to the number
// they entered:
function pageInputBoxCheckForEnter(e){ // eslint-disable-line no-unused-vars
  var key = e.which || e.keyCode;
  if (key === 13){ // 13 is enter
    goBtnFunction();
  }
}

// This is the function that goes back one page:
function previousPageBtnFunction(){ // eslint-disable-line no-unused-vars
  if(currentPg > 1){
    loadPage(currentPg - 1);
  }
}

// This is the function that goes forward one page:
function nextPageBtnFunction(){ // eslint-disable-line no-unused-vars
  if(currentPg < arrayOfCurrentImages.length){
    loadPage(currentPg + 1);
  }
}

// This is the function that runs when the GO button is clicked/tapped:
function goBtnFunction(){
  var input = document.getElementById('pageTextBoxID').value;
  var tempNum = parseInt(input, 10);
  if(isNaN(tempNum) || tempNum > arrayOfCurrentImages.length || tempNum < 1){
    document.getElementById('pageTextBoxID').style.backgroundColor = 'red';
  }
  else{
    document.getElementById('pageTextBoxID').style.backgroundColor = 'white';
    loadPage(tempNum);
  }
}

// Here is the function that handles testing to see if we can delete a page:
function deletePageBtnFunction(){ // eslint-disable-line no-unused-vars
  if(arrayOfCurrentImages.length > 1){
    // Here we question them if they want to delete the page, and delete it if they say yes.
    // eslint-disable-next-line max-len
    var ret = confirm('Are you sure you want to delete this page?');
      
    if(ret === true){
      // Delete the page...
      deleteCurrentPage();
    }
  }
  else{
    // Here we tell them that the document must have at least one page:
    // eslint-disable-next-line max-len
    alert('Sorry, the document must have at least one page at all times.\nHowever, you can add another page and then come back and delete this one.', '');
  }
}

// Here is the function that handles actually deleting a page:
function deleteCurrentPage(){
  arrayOfCurrentImages.splice(currentPg - 1, 1);
  arrayOfOriginalImages.splice(currentPg - 1, 1);
  arrayOfOriginalImagesX.splice(currentPg - 1, 1);
  arrayOfOriginalImagesY.splice(currentPg - 1, 1);
  if(currentPg > 1){
    --currentPg;
  }
  resizeAndLoadImagesOntoCanvases(arrayOfCurrentImages[currentPg - 1], arrayOfOriginalImages[currentPg - 1],
  arrayOfOriginalImagesX[currentPg - 1], arrayOfOriginalImagesY[currentPg - 1]);
  updatePageNumsOnGui();
  clearUndoHistory();
}

// This is the function that gets called when the user wants to paste something wile re-sizing it:
function pasteAndResizeToolFunction(){ // eslint-disable-line no-unused-vars
  var incomming = document.getElementById('OTDPercentInput').value;
  incomming = parseInt(incomming, 10);
  if(isNaN(incomming) || incomming > 400 || incomming < 10){
    alert('Error: Please enter a valid percent.', ' ');
  }
  else{
    if(copiedSectionOfCanvas !== 'NA'){
      var tempCanvas1 = document.createElement('canvas');
      var tempContext1 = tempCanvas1.getContext('2d');
      tempCanvas1.width = copiedSectionOfCanvas.width;
      tempCanvas1.height = copiedSectionOfCanvas.height;
      tempContext1.putImageData(copiedSectionOfCanvas, 0, 0);
      var dataUrl = tempCanvas1.toDataURL();
      var someImage = new Image();
      someImage.theScaleFactor = incomming;
      someImage.onload = function (){
        var tempCanvas2 = document.createElement('canvas');
        var tempContext2 = tempCanvas2.getContext('2d');
        var finalX = this.naturalWidth * (this.theScaleFactor / 100);
        var finalY = this.naturalHeight * (this.theScaleFactor / 100);
        finalX = parseInt(finalX, 10);
        finalY = parseInt(finalY, 10);
        tempCanvas2.width = finalX;
        tempCanvas2.height = finalY;
        tempContext2.drawImage(this, 0, 0, finalX, finalY);
        copiedSectionOfCanvasForScale = tempContext2.getImageData(0, 0, finalX, finalY);
        tool = 'PASTE-S';
        updateTextOfToolBtn();
        OTDCloseDialog();
      };
      someImage.src = dataUrl;
    }
    else{
      tellUserToCopySomethingFirst();
    }
  }
}

// This function sanitizes the input from the percentage text box on the Tool -> Other dialog
// and changes its color appropriately: 
function OTDCheckPercentInput(){ // eslint-disable-line no-unused-vars
  var elm = document.getElementById('OTDPercentInput');
  var incomming = elm.value;
  incomming = parseInt(incomming, 10);
  if(isNaN(incomming) || incomming > 400 || incomming < 10){
    elm.style.backgroundColor = 'red';
  }
  else{
    elm.style.backgroundColor = 'white';
  }
}



// ******************************************************************************
// *********                                                           **********
// *********   Below is the javascript related to the modal dialogs:   **********
// *********                                                           **********
// ******************************************************************************
// Variables that need to be global but are still only related to the applicable dialog
// are named beginning with the initials of the dialog's id.
// Functions are also named starting with the same initials.


// Here is the code for the settingsDialog:
var SDValid = true;

// This is the function that initializes the settings dialog when they choose the gear icon/button.
function SDReadySettingsDialog(){ // eslint-disable-line no-unused-vars
  document.getElementById('SDCursorDropdown').value = currentCursorValue;
  // Remember the global variable is always 1 more than the number of entries actually stored:
  document.getElementById('SDUndoHistoryBox').value = maxUndoHistory - 1;
  document.getElementById('SDMaxPagesAllowedBox').value = maxNumberOfPages;
  
  if(weGotKeyboardShortcuts){
    document.getElementById('SDEnableKeyboardShortcuts').checked = true;
  }
  else{
    document.getElementById('SDEnableKeyboardShortcuts').checked = false;
  }
  
  if(useWidescreenTemplates){
    document.getElementById('SDUseWidscreenTemplates').checked = true;
  }
  else{
    document.getElementById('SDUseWidscreenTemplates').checked = false;
  }
  if(useColorInvertedTemplates){
    document.getElementById('SDUseColorInvertedTemplates').checked = true;
  }
  else{
    document.getElementById('SDUseColorInvertedTemplates').checked = false;
  }
  SDInputValidation();
}

// This function sanitizes the input for the settings dialog:
function SDInputValidation(){
  var rawUndoHistory = parseInt(document.getElementById('SDUndoHistoryBox').value, 10);
  var rawMaxPages = parseInt(document.getElementById('SDMaxPagesAllowedBox').value, 10);
  var undoHistoryGood = false;
  var maxPagesGood = false;
  
  if(isNaN(rawUndoHistory) || rawUndoHistory < 10 || rawUndoHistory > 100){
    undoHistoryGood = false;
    document.getElementById('SDUndoHistoryBox').style.backgroundColor = 'red';
  }
  else{
    undoHistoryGood = true;
    document.getElementById('SDUndoHistoryBox').style.backgroundColor = 'white';
  }
  
  if(isNaN(rawMaxPages) || rawMaxPages < 200 || rawMaxPages > 999){
    maxPagesGood = false;
    document.getElementById('SDMaxPagesAllowedBox').style.backgroundColor = 'red';
  }
  else{
    maxPagesGood = true;
    document.getElementById('SDMaxPagesAllowedBox').style.backgroundColor = 'white';
  }
  
  if(undoHistoryGood && maxPagesGood){
    SDValid = true;
  }
  else{
    SDValid = false;
  }
}

// This function first tests to see if the user has entered valid data. If that check passes, it takes 
// the settings that the user specified and updates the applicable global variables or calls other
// functions that do the actual updating.
function SDOkBtnFunction(){
  if(SDValid){
    var e = document.getElementById('SDCursorDropdown');
    SDSetCursor(e.options[e.selectedIndex].value);
    
    maxUndoHistory = parseInt(document.getElementById('SDUndoHistoryBox').value, 10) + 1;
    SDActuallySetUndoLength();
    maxNumberOfPages = parseInt(document.getElementById('SDMaxPagesAllowedBox').value, 10);
    
    if(document.getElementById('SDEnableKeyboardShortcuts').checked){
      weGotKeyboardShortcuts = true;
    }
    else{
      weGotKeyboardShortcuts = false;
    }
    
    if(document.getElementById('SDUseWidscreenTemplates').checked){
      useWidescreenTemplates = true;
    }
    else{
      useWidescreenTemplates = false;
    }
    if(document.getElementById('SDUseColorInvertedTemplates').checked){
      useColorInvertedTemplates = true;
    }
    else{
      useColorInvertedTemplates = false;
    }
    document.getElementById('SDCloseBtn').click();  // Clicking the close button on dialog after we are done with it.
  }
}

// Here is a function that just sets the length of the undo array:
function SDActuallySetUndoLength(){
  var distanceFromEnd = (imageArrayForUndo.length - 1) - currentPlaceInUndoArray;
  var tempArray = [];
  if(maxUndoHistory > imageArrayForUndo.length){
    tempArray.length = maxUndoHistory - imageArrayForUndo.length;
    tempArray.fill(null);
    imageArrayForUndo = tempArray.concat(imageArrayForUndo);
  }
  if(maxUndoHistory < imageArrayForUndo.length){
    tempArray = imageArrayForUndo.splice((imageArrayForUndo.length - 1) - maxUndoHistory, maxUndoHistory);
    imageArrayForUndo = tempArray;
  }
  currentPlaceInUndoArray = (imageArrayForUndo.length - 1) - distanceFromEnd;
  if(currentPlaceInUndoArray < 0){
    clearUndoHistory();
  }
}

// This function sets the cursor that is displayed over the main canvas:
// See the values in the HTML for a better understanding of how & why
// this is set up how it is:
function SDSetCursor(vle){
  currentCursorValue = vle;
  //if(vle.substring(0, 1) === 'u'){
    //var indx = parseInt(vle.substring(1), 10);
    //document.getElementById('canvas1').style.cursor = 'url(\'' + cursorImages[indx] + '\'), auto';
  //}
  //else{
    document.getElementById('canvas1').style.cursor = vle;
  //}
}

// If the user hits enter in one of the text boxes in the settings dialog, it should probably try to
// save the settings if it can:
function SDCheckForEnter(e){ // eslint-disable-line no-unused-vars
  var key = e.which || e.keyCode;
  if (key === 13){ // 13 is enter
    SDOkBtnFunction();
  }
}


// ********Here is the code for the Open Images Dialog:********

// This just gets the dialog ready:
function OIDReadyOpenImagesDialog(){ // eslint-disable-line no-unused-vars
  
  alert('Unfortunately, this functionality is only available in the full version at the moment. You can download the full version for free from rogersmathwhiteboard.com.');
  return;
}


// ********Here is the code for the saveImagesDialog:********


// This function simply sets up the save images dialog:
function SIDReadySaveImagesDialog(){ // eslint-disable-line no-unused-vars
  
  alert('Unfortunately, this functionality is only available in the full version at the moment. However, you may be able to right-click on individual pages and save them that way if you need to.');
  return;
}


// ********Here is the code for the aboutDialog:********

// This function readies the about dialog.
function ADReadyAboutDialog(){ // eslint-disable-line no-unused-vars
  // eslint-disable-next-line max-len
  document.getElementById('ADVersionLine').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Roger’s Math Whiteboard version 2.718.281.828 can be best understood as a multi-page image editor designed around the specific needs of math and science teachers who want to take advantage of pen/touch/stylus input while presenting. It is designed to be used while presenting content in class, and/or while working through questions from students.';
}

// ********Here is the code for the fileOtherDialog:********

var FODPercentValid = true;
var FODImagesToLoad;
var FODImagesLoaded;
var FODImgForInsertion1;
var FODImgForInsertion2;
var FODOrgX;
var FODOrgY;

// Here is what happens when the user chooses to duplicate the page:
function FODDuplicatePage(){ // eslint-disable-line no-unused-vars
  saveCurrentImageToArrayBeforeMoving();
  insertPageUsingImage(arrayOfCurrentImages[currentPg - 1]);
  arrayOfOriginalImages[currentPg - 1] = arrayOfOriginalImages[currentPg - 2];
  loadPage(currentPg);
  document.getElementById('FODCloseBtn').click();
}

// This function is executed when the user chooses to make the current drawing permanent.
function FODMakeCurrentDrawingPermanent(){ // eslint-disable-line no-unused-vars
  saveCurrentImageToArrayBeforeMoving();
  arrayOfOriginalImages[currentPg - 1] = arrayOfCurrentImages[currentPg - 1];
  loadPage(currentPg);
  document.getElementById('FODCloseBtn').click();
}

// This function executes when the user chooses to rotate the page in a particular direction:
function FODRotateDrawingSurface(direction){ // eslint-disable-line max-statements, no-unused-vars
  saveCurrentImageToArrayBeforeMoving();
  var currentImageOnScreen = arrayOfCurrentImages[currentPg - 1];
  var currentOriginalImage = arrayOfOriginalImages[currentPg - 1];
  var ofscreenCanvas1 = document.createElement('canvas');
  var ofscreenCanvas2 = document.createElement('canvas');
  FODOrgX = context.canvas.width;
  FODOrgY = context.canvas.height;
  ofscreenCanvas1.width = FODOrgY;
  ofscreenCanvas1.height = FODOrgX;
  ofscreenCanvas2.width = arrayOfOriginalImagesY[currentPg - 1];
  ofscreenCanvas2.height = arrayOfOriginalImagesX[currentPg - 1];
  var contextR1 = ofscreenCanvas1.getContext('2d');
  var contextR2 = ofscreenCanvas2.getContext('2d');
  var xcord1;
  var ycord1;
  var xcord2;
  var ycord2;
  if(direction === 'clockwise'){
    contextR1.rotate(90 * Math.PI / 180);
    contextR2.rotate(90 * Math.PI / 180);
    xcord1 = 0;
    xcord2 = 0;
    ycord1 = -FODOrgY;
    ycord2 = -arrayOfOriginalImagesY[currentPg - 1];
  }
  else{
    contextR1.rotate(-90 * Math.PI / 180);
    contextR2.rotate(-90 * Math.PI / 180);
    xcord1 = -FODOrgX;
    xcord2 = -arrayOfOriginalImagesX[currentPg - 1];
    ycord1 = 0;
    ycord2 = 0;
  }
  contextR1.drawImage(currentImageOnScreen, xcord1, ycord1, FODOrgX, FODOrgY);
  contextR2.drawImage(currentOriginalImage, xcord2, ycord2,
  arrayOfOriginalImagesX[currentPg - 1], arrayOfOriginalImagesY[currentPg - 1]);
  var du1 = ofscreenCanvas1.toDataURL();
  var du2 = ofscreenCanvas2.toDataURL();
  FODImagesToLoad = 2;
  FODImagesLoaded = 0;
  FODImgForInsertion1 = null;
  FODImgForInsertion1 = new Image();
  FODImgForInsertion1.onload = FODContinueRotateDrawingSurfaceClockwise;
  FODImgForInsertion1.src = du1;
  FODImgForInsertion2 = null;
  FODImgForInsertion2 = new Image();
  FODImgForInsertion2.onload = FODContinueRotateDrawingSurfaceClockwise;
  FODImgForInsertion2.src = du2;
}

// This is essentially a helper function that continues the process of rotating a page
// after the image loads.
function FODContinueRotateDrawingSurfaceClockwise(){
  ++FODImagesLoaded;
  if(FODImagesLoaded === FODImagesToLoad){
    arrayOfCurrentImages[currentPg - 1] = FODImgForInsertion1;
    arrayOfOriginalImages[currentPg - 1] = FODImgForInsertion2;
    var tmpx = arrayOfOriginalImagesX[currentPg - 1];
    var tmpy = arrayOfOriginalImagesY[currentPg - 1];
    arrayOfOriginalImagesX[currentPg - 1] = tmpy;
    arrayOfOriginalImagesY[currentPg - 1] = tmpx;
    resizeAndLoadImagesOntoCanvases(FODImgForInsertion1, FODImgForInsertion2, tmpy, tmpx);
    updatePageNumsOnGui();
    clearUndoHistory();
    document.getElementById('FODCloseBtn').click();
  }
}

// This function allows the user to import an image from their clipboard:
function FODImportFromSystem(scle){ // eslint-disable-line no-unused-vars
  
  alert('Unfortunately, this functionality is only available in the full version at the moment. You can download the full version for free from rogersmathwhiteboard.com.');
  return;
}

// This is the function that actually gets called by the import image from clipboard & resize button
// It then calls the function above which actually does the work:
function FODImportFromSystemResize(){ // eslint-disable-line no-unused-vars
  
  alert('Unfortunately, this functionality is only available in the full version at the moment. You can download the full version for free from rogersmathwhiteboard.com.');
  return;
}

// Here is the input validation function for the scale percent input
function FODCheckPercentInput(){ // eslint-disable-line no-unused-vars
  var elm = document.getElementById('FODPercentInput');
  var incomming = elm.value;
  incomming = parseInt(incomming, 10);
  if(isNaN(incomming) || incomming > 400 || incomming < 10){
    elm.style.backgroundColor = 'red';
    FODPercentValid = false;
  }
  else{
    elm.style.backgroundColor = 'white';
    FODPercentValid = true;
  }
}

// Here is the function that allows the user to export an image on the program's clipboard to
// their system's clipboard.
function FODExportCopiedSection(){ // eslint-disable-line no-unused-vars
  
  alert('Unfortunately, this functionality is only available in the full version at the moment. You can download the full version for free from rogersmathwhiteboard.com.');
  return;
}

// ********Here is the code for the insertTextDialog:********
var ITDValid = true;

// Here is the function that readies the insertTextDialog:
function ITDReadyInsertTextDialog(){ // eslint-disable-line no-unused-vars
  document.getElementById('ITDTextBox').value = textToInsert;
  ITDValidationFunction();
  document.getElementById('ITDTextBox').focus();
  document.getElementById('ITDTextBox').select();
}

// Here is the function that adds a character to the text field:
function ITDAddCharacter(chr){ // eslint-disable-line no-unused-vars
  var textBox = document.getElementById('ITDTextBox');
  var alreadyThere = textBox.value;
  var sStart = textBox.selectionStart;
  var sEnd = textBox.selectionEnd;
  var beforeSelection = alreadyThere.substring(0, sStart);
  var afterSelection = alreadyThere.substring(sEnd);
  textBox.value = beforeSelection + chr + afterSelection;
  textBox.focus();
  textBox.setSelectionRange(sStart + 1, sStart + 1);
  ITDValidationFunction();
}

// Here is the function that removes a character from the text box based on where the cursor is.
function ITDBackspace(){ // eslint-disable-line no-unused-vars
  var textBox = document.getElementById('ITDTextBox');
  var alreadyThere = textBox.value;
  var sStart = textBox.selectionStart;
  var sEnd = textBox.selectionEnd;
  var beforeSelection;
  var afterSelection;
  if(sStart === sEnd){
    beforeSelection = alreadyThere.substring(0, sStart - 1);
    afterSelection = alreadyThere.substring(sEnd);
    textBox.value = beforeSelection + afterSelection;
    textBox.focus();
    textBox.setSelectionRange(sStart - 1, sStart - 1);
    ITDValidationFunction();
  }
  else{
    beforeSelection = alreadyThere.substring(0, sStart);
    afterSelection = alreadyThere.substring(sEnd);
    textBox.value = beforeSelection + afterSelection;
    textBox.focus();
    textBox.setSelectionRange(sStart, sStart);
    ITDValidationFunction();
  }
}

// Here is the function that clears out the entire text box:
function ITDClear(){ // eslint-disable-line no-unused-vars
  document.getElementById('ITDTextBox').value = '';
  document.getElementById('ITDTextBox').focus();
  ITDValidationFunction();
}

// Here is the input validation function for the text box.
// It basically makes sure there is at least 1 character
// in the text box and sets the box to red if there isn't.
function ITDValidationFunction(){
  var input = document.getElementById('ITDTextBox').value;
  if(input.length < 1){
    ITDValid = false;
    document.getElementById('ITDTextBox').style.backgroundColor = 'red';
  }
  else{
    ITDValid = true;
    document.getElementById('ITDTextBox').style.backgroundColor = 'white';
  }
}

// Here is the function that executes when the OK button is pressed on the insert text dialog:
function ITDOkBtnFunction(){
  if(ITDValid){
    textToInsert = document.getElementById('ITDTextBox').value;
    tool = 'text';
    updateTextOfToolBtn();
    document.getElementById('ITDCloseBtn').click();  // Clicking the close button on dialog after we are done with it.
  }
}

// If the user hits enter while typing in the text box that should be the same as choosing OK:
function ITDCheckForEnter(e){ // eslint-disable-line no-unused-vars
  var key = e.which || e.keyCode;
  if (key === 13){ // 13 is enter
    ITDOkBtnFunction();
  }
}

// ********Here is the code for the otherToolDialog:********

// This function just closes the dialog:
function OTDCloseDialog(){ // eslint-disable-line no-unused-vars
  document.getElementById('OTDCloseBtn').click();  // Clicking the close button on dialog after we are done with it.
}

// ********Here is the code for the otherColorDialog:********
var OCDColor = 'rgba(78, 78, 255, 1.0)';
var OCDRed = 78;
var OCDGreen = 78;
var OCDBlue = 78;
var OCDAlpha = 1.0;
var OCDValid = true;

// This function readies the color picker dialog:
function OCDReadyOtherColorDialog(){ // eslint-disable-line no-unused-vars
  // Set up the canvas on which the two color wheels will be painted:
  var canvas = document.getElementById('OCDPickerCanvas');
  var context = canvas.getContext('2d');
  var x = canvas.width / 2;
  var y = canvas.height / 4;
  var radius = canvas.width / 2;
  
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, (canvas.height / 2));

  context.fillStyle = 'black';
  context.fillRect(0, (canvas.height / 2), canvas.width, (canvas.height / 2));
  
  // Draw the two color wheels:
  OCDDrawColorCircle(x, y, radius, context, false);
  OCDDrawColorCircle(x, 3 * y, radius, context, true);
  
  var value = instrumentColor.split(',');
  OCDRed = parseInt(value[0].substring(5), 10);
  OCDGreen = parseInt(value[1].substring(1), 10);
  OCDBlue = parseInt(value[2].substring(1), 10);
  var temp = value[3].substring(1);
  OCDAlpha = parseFloat(temp.substring(0, temp.length - 1));
  
  OCDUpdateTextBoxes();
  OCDValidateInputAndUpdateIfApplicable();
  OCDUpdateExample();
}

// This function basically draws the color circles:
function OCDDrawColorCircle(x, y, r, ctx, drk){
  // Create a color circle:
  // This code is a modified version of the code written by shoo found at:
  // https://stackoverflow.com/a/29452034
  // I appreciate shoo's work! It makes a great color circle.
  var prcent = 100;
  if(drk){
    prcent = 0;
  }
  
  for(var angle = 0; angle <= 360; angle += 1){
    var startAngle = (angle - 1) * Math.PI / 180;
    var endAngle = (angle + 1) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, startAngle, endAngle);
    ctx.closePath();
    var gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0,'hsl(' + angle + ', 10%, ' + prcent + '%)');
    gradient.addColorStop(1,'hsl(' + angle + ', 100%, 50%)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// This function executes when the mouse goes down on the color selection canvas:
function OCDMouseDown(e){ // eslint-disable-line no-unused-vars
  var offset = getCoords(document.getElementById('OCDPickerCanvas'));
  OCDOnInstrumentDown(e.pageX - offset.left, e.pageY - offset.top);
}

// This function executes when the user touches somewhere on the color selection canvas:
function OCDTouchStart(e){ // eslint-disable-line no-unused-vars
  if(e.touches.length === 1){
    var offset = getCoords(document.getElementById('OCDPickerCanvas'));
    OCDOnInstrumentDown(e.changedTouches[0].pageX - offset.left, e.changedTouches[0].pageY - offset.top);
    e.preventDefault();
  }
}

// This function basically updates the text boxes according to the color the user chose.
function OCDUpdateTextBoxes(){
  document.getElementById('OCDRedTextBox').value = OCDRed;
  document.getElementById('OCDRedTextBox').style.backgroundColor = 'white';
  document.getElementById('OCDGreenTextBox').value = OCDGreen;
  document.getElementById('OCDGreenTextBox').style.backgroundColor = 'white';
  document.getElementById('OCDBlueTextBox').value = OCDBlue;
  document.getElementById('OCDBlueTextBox').style.backgroundColor = 'white';
  var temp = 100 - (parseInt(OCDAlpha * 100, 10));
  document.getElementById('OCDTransparencyTextBox').value = temp;
  document.getElementById('OCDTransparencyTextBox').style.backgroundColor = 'white';
  document.getElementById('OCDRedTextBox').select();
}

// This function executes whenever the user clicks/touches somewhere on the color selection canvas:
// It basically gets the pixel directly under their click/touch and gets its color & updates the GUI.
function OCDOnInstrumentDown(x, y){
  var canvas = document.getElementById('OCDPickerCanvas');
  var context = canvas.getContext('2d');
  var temp = context.getImageData(x, y, 1, 1);
  OCDRed = temp.data[0];
  OCDGreen = temp.data[1];
  OCDBlue = temp.data[2];
  OCDAlpha = 1.0;
  OCDColor = 'rgba(' + OCDRed + ', ' + OCDGreen + ', ' + OCDBlue + ', ' + OCDAlpha + ')';
  
  OCDUpdateTextBoxes();
  OCDValidateInputAndUpdateIfApplicable();
  OCDUpdateExample();
}

// This function validates the input on the otherColor dialog and sets the appropriate box to red
// if it finds something that isn't valid.
function OCDValidateInputAndUpdateIfApplicable(){ // eslint-disable-line max-statements
  var tempRed = parseInt(document.getElementById('OCDRedTextBox').value, 10);
  var tempGreen = parseInt(document.getElementById('OCDGreenTextBox').value, 10);
  var tempBlue = parseInt(document.getElementById('OCDBlueTextBox').value, 10);
  var tempAlpha = parseInt(document.getElementById('OCDTransparencyTextBox').value, 10);
  
  var redIsGood = false;
  var greenIsGood = false;
  var blueIsGood = false;
  var alphaIsGood = false;

  if(isNaN(tempRed) || tempRed < 0 || tempRed > 255){
    redIsGood = false;
    document.getElementById('OCDRedTextBox').style.backgroundColor = 'red';
  }
  else{
    redIsGood = true;
    document.getElementById('OCDRedTextBox').style.backgroundColor = 'white';
  }
  if(isNaN(tempGreen) || tempGreen < 0 || tempGreen > 255){
    greenIsGood = false;
    document.getElementById('OCDGreenTextBox').style.backgroundColor = 'red';
  }
  else{
    greenIsGood = true;
    document.getElementById('OCDGreenTextBox').style.backgroundColor = 'white';
  }
  if(isNaN(tempBlue) || tempBlue < 0 || tempBlue > 255){
    blueIsGood = false;
    document.getElementById('OCDBlueTextBox').style.backgroundColor = 'red';
  }
  else{
    blueIsGood = true;
    document.getElementById('OCDBlueTextBox').style.backgroundColor = 'white';
  }
  if(isNaN(tempAlpha) || tempAlpha < 0 || tempAlpha > 100){
    alphaIsGood = false;
    document.getElementById('OCDTransparencyTextBox').style.backgroundColor = 'red';
  }
  else{
    alphaIsGood = true;
    document.getElementById('OCDTransparencyTextBox').style.backgroundColor = 'white';
  }
  if(redIsGood && greenIsGood && blueIsGood && alphaIsGood){
    OCDValid = true;
    OCDRed = tempRed;
    OCDGreen = tempGreen;
    OCDBlue = tempBlue;
    OCDAlpha = 1.0 - (tempAlpha / 100);
    OCDColor = 'rgba(' + OCDRed + ', ' + OCDGreen + ', ' + OCDBlue + ', ' + OCDAlpha + ')';
    OCDUpdateExample();
  }
  else{
    OCDValid = false;
  }
}

// This function updates the color example so that the user can see what color they have chosen:
function OCDUpdateExample(){
  var canvas = document.getElementById('OCDColorChosenExampleCanvas');
  var context = canvas.getContext('2d');
  context.rect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.fill();
  
  context.font = '20px sans-serif';
  context.fillStyle = 'black';
  context.fillText('I\'m Transparent!', 15, 25);
  
  context.rect(0, 0, canvas.width, canvas.height);
  context.fillStyle = OCDColor;
  context.fill();
}

// Here is the function that executes when the user chooses the OK button.
// It basically makes sure there are no invalid entries in the text boxes
// and then updates the color if that is the case.
function OCDOkBtnFunction(){
  if (OCDValid){
    instrumentColor = OCDColor;
    updateColorOfColorBtn();
    document.getElementById('OCDCloseBtn').click();  // Clicking the close button on dialog after we are done with it.
  }
}

// If the user presses enter inside of one of the text boxes, we will run the ok button function:
function OCDCheckForEnter(e){ // eslint-disable-line no-unused-vars
  var key = e.which || e.keyCode;
  if (key === 13){ // 13 is enter
    OCDOkBtnFunction();
  }
}

// ********Here is the code for the otherSizeDialog:********
var OSDValid = true;

// Here is the function that readies the other size dialog:
function OSDReadyOtherSizeDialog(){ // eslint-disable-line no-unused-vars
  document.getElementById('OSDSizeTextBox').value = instrumentWidth;
  document.getElementById('OSDSizeTextBox').select();
}

// Here is the function that adds a character to the size text box.
// Note that because we used a number input field, we cannot place
// the new character where the cursor is. unfortunately we can only
// place it at the end of the existing content.
function OSDAddCharacter(chr){ // eslint-disable-line no-unused-vars
  var textBox = document.getElementById('OSDSizeTextBox');
  var alreadyThere = textBox.value;
  textBox.value = alreadyThere + chr;
  OSDValidateInput();
}

// Here is the backspace function. It just removes one character from the end of the
// content in the number input field.
function OSDBackspace(){ // eslint-disable-line no-unused-vars
  var textBox = document.getElementById('OSDSizeTextBox');
  var alreadyThere = textBox.value;
  textBox.value = alreadyThere.substring(0, alreadyThere.length - 1);
  OSDValidateInput();
}

// Here is the clear function is clears the number input field.
function OSDClear(){ // eslint-disable-line no-unused-vars
  document.getElementById('OSDSizeTextBox').value = '';
  document.getElementById('OSDSizeTextBox').focus();
  OSDValidateInput();
}

// Here is the validation function for the number input field.
// It basically ensures that the number entered is within the
// limits defined and marks the field red if it isn't.
function OSDValidateInput(){
  var rawInput = parseInt(document.getElementById('OSDSizeTextBox').value, 10);
  if(isNaN(rawInput) || rawInput < 2 || rawInput > 2000){
    OSDValid = false;
    document.getElementById('OSDSizeTextBox').style.backgroundColor = 'red';
  }
  else{
    OSDValid = true;
    document.getElementById('OSDSizeTextBox').style.backgroundColor = 'white';
  }
}

// Here is the OK button function. It basically checks that the number entered is
// within the acceptable limits and proceeds only if that is the case.
function OSDOkBtnFunction(){
  if (OSDValid){
    instrumentWidth = parseInt(document.getElementById('OSDSizeTextBox').value, 10);
    updateTextOfSizeBtn();
    document.getElementById('OSDCloseBtn').click();  // Clicking the close button on dialog after we are done with it.
  }
}

// If the user presses enter in the number input box, we will click the ok button for them.
function OSDCheckForEnter(e){ // eslint-disable-line no-unused-vars
  var key = e.which || e.keyCode;
  if (key === 13){ // 13 is enter
    OSDOkBtnFunction();
  }
}

// ********Here is the code for the insertScreenshotDialog:********

// ********Here is the code for the otherPageDialog:********

// Here is the function that inserts pages from the otherPage dialog.
// Note the pattern used in naming files and how they are used 
// depending on whether widescreen or inverted colors is selected.
function OPDInsertPage(e){ // eslint-disable-line no-unused-vars
  var locOfTem = e.target.src;
  var before = locOfTem.substring(0, (locOfTem.length - 4));
  if(useWidescreenTemplates){
    before += '-wide';
  }
  if(useColorInvertedTemplates){
    before += '-b';
  }
  before += '.png';
  insertTemplateAsPage(before);
  document.getElementById('OPDCloseBtn').click();  // Clicking the close button on dialog after we are done with it.
}

// Here is the function that inserts a colored page:
function OPDInsertColoredPage(){ // eslint-disable-line no-unused-vars
  var whiteImage = new Image();
  whiteImage.onload = function (){
    var orgWidth = context.canvas.width;
    var orgHeight = context.canvas.height;
    var originalImageOnCanvas = new Image();
    originalImageOnCanvas.onload = function (){
      if(useWidescreenTemplates){
        context.canvas.width = 2867;
      }
      else{
        context.canvas.width = 2200;
      }
      context.canvas.height = 1700;
      context.drawImage(whiteImage, 0, 0);
      context.fillStyle = instrumentColor;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      var imageToInsert = new Image();
      imageToInsert.onload = function (){
        insertPageUsingImage(this);
      };
      imageToInsert.src = context.canvas.toDataURL('image/png');
      context.canvas.width = orgWidth;
      context.canvas.height = orgHeight;
      context.drawImage(originalImageOnCanvas, 0, 0);
    };
    originalImageOnCanvas.src = context.canvas.toDataURL('image/png');
  };
  if(useWidescreenTemplates){
    whiteImage.src = 'images/Blank_White_Page-wide.png';
  }
  else{
    whiteImage.src = 'images/Blank_White_Page.png';
  }
  document.getElementById('OPDCloseBtn').click();  // Clicking the close button on dialog after we are done with it.
}



// ***************************** END OF CODE FOR OTHER WINDOWS!!!
// The functions below are of a more general nature. They are intended to be available
// to all other parts of the code. Typically they are used to manage various aspects
// of the main interface or the drawing area. It can kinda be thought of as the
// miscellaneous functions section.



// Here is the function that cancels the selected region if there is a region of the whiteboard that
// is selected.
function cancelSelect(){
  if(areaSelected === true){
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    prevX = 'NA';
    prevY = 'NA';
    tempX = 'NA';
    tempY = 'NA';
    areaSelected = false;
  }
}

// Here is the function that updates the color of the text on the color button.
function updateColorOfColorBtn(){
  document.getElementById('colorBtn').style.color = instrumentColor;
}

// Here is the function that updates the text of the size button:
function updateTextOfSizeBtn(){
  switch(instrumentWidth){
  case 2:
    document.getElementById('sizeBtn').innerHTML = 'Size: S';
    break;
  case 5:
    document.getElementById('sizeBtn').innerHTML = 'Size: M';
    break;
  case 10:
    document.getElementById('sizeBtn').innerHTML = 'Size: L';
    break;
  default:
    document.getElementById('sizeBtn').innerHTML = 'Size: ' + instrumentWidth;
    break;
  
  }
}

// Here is the function that updates the text of the tool button:
function updateTextOfToolBtn(){
  switch(tool){
  case 'pen':
    document.getElementById('toolBtn').innerHTML = 'Tool: P';
    break;
  case 'eraser':
    document.getElementById('toolBtn').innerHTML = 'Tool: E';
    break;
  case 'line':
    document.getElementById('toolBtn').innerHTML = 'Tool: L';
    break;
  case 'select':
    document.getElementById('toolBtn').innerHTML = 'Tool: S';
    break;
  case 'text':
    document.getElementById('toolBtn').innerHTML = 'Tool: T';
    break;
  case 'identify':
    document.getElementById('toolBtn').innerHTML = 'Tool: I';
    break;
  case 'dot':
    document.getElementById('toolBtn').innerHTML = 'Tool: D';
    break;
  case 'PASTE':
    document.getElementById('toolBtn').innerHTML = 'Tool: Paste';
    break;
  case 'central-line':
    document.getElementById('toolBtn').innerHTML = 'Tool: CL';
    break;
  case 'dashed-line':
    document.getElementById('toolBtn').innerHTML = 'Tool: DL';
    break;
  case 'dashed-central-line':
    document.getElementById('toolBtn').innerHTML = 'Tool: DCL';
    break;
  case 'PASTE-S':
    document.getElementById('toolBtn').innerHTML = 'Tool: Paste-S';
    break;
  default:
    throw new Error('Invalid tool. Cant update tool button text: ' + tool);
  }
}


// Below are the functions that execute whenever the applicable buttons are clicked.
// They are in order from right to left.

// This is the function that executes when the undo button is pressed:
function undoBtnFunction(){
  if(currentPlaceInUndoArray > 0){
    if(imageArrayForUndo[currentPlaceInUndoArray - 1] !== null){
      --currentPlaceInUndoArray;
      resizeAndLoadImagesOntoCanvases(imageArrayForUndo[currentPlaceInUndoArray], arrayOfOriginalImages[currentPg - 1],
      arrayOfOriginalImagesX[currentPg - 1], arrayOfOriginalImagesY[currentPg - 1]);
    }
  }
}

// This is the function that executes when the redo button is pressed:
function redoBtnFunction(){
  if(currentPlaceInUndoArray < imageArrayForUndo.length - 1){
    if(imageArrayForUndo[currentPlaceInUndoArray + 1] !== null){
      ++currentPlaceInUndoArray;
      resizeAndLoadImagesOntoCanvases(imageArrayForUndo[currentPlaceInUndoArray], arrayOfOriginalImages[currentPg - 1],
      arrayOfOriginalImagesX[currentPg - 1], arrayOfOriginalImagesY[currentPg - 1]);
    }
  }
}

// This is the function that executes when the copy button is pressed:
function copyBtnFunction(){
  if(areaSelected === true){
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    var drawingX = Math.min(tempX, prevX);
    var drawingY = Math.min(tempY, prevY);
    var drawingWidth = Math.abs(tempX - prevX);
    var drawingHeight = Math.abs(tempY - prevY);
    var difference = 0;
    if(drawingX < 0){
      difference = Math.abs(drawingX - 0);
      drawingX = 0;
      drawingWidth = drawingWidth - difference;
    }
    if(drawingY < 0){
      difference = Math.abs(drawingY - 0);
      drawingY = 0;
      drawingHeight = drawingHeight - difference;
    }
    if((drawingX + drawingWidth) > context.canvas.width){
      difference = Math.abs((drawingX + drawingWidth) - context.canvas.width);
      drawingWidth = drawingWidth - difference;
    }
    if((drawingY + drawingHeight) > context.canvas.height){
      difference = Math.abs((drawingY + drawingHeight) - context.canvas.height);
      drawingHeight = drawingHeight - difference;
    }
    copiedSectionOfCanvas = 'NA';
    copiedSectionOfCanvas = new Image();
    copiedSectionOfCanvas = context.getImageData(drawingX, drawingY, drawingWidth, drawingHeight);
    
    prevX = 'NA';
    prevY = 'NA';
    tempX = 'NA';
    tempY = 'NA';
    areaSelected = false;
  }
  else{
    tellUserToSelectAnAreaFirst();
  }
}

// This is the function that executes when the paste button is pressed:
function pasteBtnFunction(){
  if(copiedSectionOfCanvas !== 'NA'){
    tool = 'PASTE';
    updateTextOfToolBtn();
  }
  else{
    tellUserToCopySomethingFirst();
  }
}

// This is the function that executes when the draw rectangle button is pressed:
function drawRectangleBtnFunction(){ // eslint-disable-line no-unused-vars
  if(areaSelected === true){
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    
    context.strokeStyle = instrumentColor;
    context.lineJoin = 'round';
    context.lineWidth = instrumentWidth;
    context.beginPath();
    context.moveTo(tempX, tempY);
    context.lineTo(prevX, tempY);
    context.lineTo(prevX, prevY);
    context.lineTo(tempX, prevY);
    context.closePath();
    context.stroke();
    
    prevX = 'NA';
    prevY = 'NA';
    tempX = 'NA';
    tempY = 'NA';
    areaSelected = false;
    pushStateIntoUndoArray();
    tempCanvasForInterval = 'NA';
  }
  else{
    tellUserToSelectAnAreaFirst();
  }
}

// This is the function that executes when the fill rectangle button is pressed:
function fillRectangleBtnFunction(){ // eslint-disable-line no-unused-vars
  if(areaSelected === true){
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    var drawingX = Math.min(tempX, prevX);
    var drawingY = Math.min(tempY, prevY);
    var drawingWidth = Math.abs(tempX - prevX);
    var drawingHeight = Math.abs(tempY - prevY);
    context.fillStyle = instrumentColor;
    context.fillRect(drawingX, drawingY, drawingWidth, drawingHeight);
    
    prevX = 'NA';
    prevY = 'NA';
    tempX = 'NA';
    tempY = 'NA';
    areaSelected = false;
    pushStateIntoUndoArray();
    tempCanvasForInterval = 'NA';
  }
  else{
    tellUserToSelectAnAreaFirst();
  }
}

// This is the function that executes when the draw ellipse button is pressed:
function drawEllipseBtnFunction(){ // eslint-disable-line no-unused-vars, max-statements
  if(areaSelected === true){
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    
    var widthOfSelection = Math.abs(tempX - prevX);
    var heightOfSelection = Math.abs(tempY - prevY);
    var minRadius = parseInt(Math.min(widthOfSelection, heightOfSelection) / 2, 10);
    var minX = Math.min(tempX, prevX);
    var minY = Math.min(tempY, prevY);
    var centerOfSelectionX = minX + (parseInt(widthOfSelection / 2, 10));
    var centerOfSelectionY = minY + (parseInt(heightOfSelection / 2, 10));
    var xScaleFactor;
    var yScaleFactor;
    var longerDimention;
    if(widthOfSelection < heightOfSelection){
      // width (x) is limiting:
      xScaleFactor = 1;
      longerDimention = heightOfSelection / 2;
      yScaleFactor = longerDimention / minRadius;
    }
    else{
      // height (y) is limiting or same:
      yScaleFactor = 1;
      longerDimention = widthOfSelection / 2;
      xScaleFactor = longerDimention / minRadius;
    }
    
    context.save();
    context.translate(centerOfSelectionX, centerOfSelectionY);
    context.scale(xScaleFactor, yScaleFactor);
    context.beginPath();
    context.arc(0, 0, minRadius, 0, 2 * Math.PI, false);
    context.restore();
    context.lineWidth = instrumentWidth;
    context.strokeStyle = instrumentColor;
    context.stroke();
    
    prevX = 'NA';
    prevY = 'NA';
    tempX = 'NA';
    tempY = 'NA';
    areaSelected = false;
    pushStateIntoUndoArray();
    tempCanvasForInterval = 'NA';
  }
  else{
    tellUserToSelectAnAreaFirst();
  }
}

// This is the function that executes when the fill ellipse button is pressed:
function fillEllipseBtnFunction(){ // eslint-disable-line no-unused-vars
  if(areaSelected === true){
    context.drawImage(tempCanvasForInterval, 0, 0, context.canvas.width, context.canvas.height);
    var drawingX = Math.min(tempX, prevX);
    var drawingY = Math.min(tempY, prevY);
    var rw = (Math.abs(tempX - prevX)) / 2;
    var rh = (Math.abs(tempY - prevY)) / 2;
    context.beginPath();
    context.fillStyle = instrumentColor;
    context.ellipse((drawingX + rw), (drawingY + rh), rw, rh, 0, 0, Math.PI * 2, false);
    context.fill();
    
    prevX = 'NA';
    prevY = 'NA';
    tempX = 'NA';
    tempY = 'NA';
    areaSelected = false;
    pushStateIntoUndoArray();
    tempCanvasForInterval = 'NA';
  }
  else{
    tellUserToSelectAnAreaFirst();
  }
}


// Here is the function that pushes the current state of the whiteboard into the undo array:
function pushStateIntoUndoArray(){
  if(currentPlaceInUndoArray !== imageArrayForUndo.length - 1){
    // This means they have just undone something, and are going on from there, so we have to get the remainder
    // of the undo array, (if applicable), and make the undo array just contain that. Then re-set the 
    // currentPlaceInUndoArray to imageArrayForUndo.length - 1, and also push in the current state.
    
    var tempArray = imageArrayForUndo.slice(0, currentPlaceInUndoArray + 1);
    var currentImage = new Image();
    currentImage.src = context.canvas.toDataURL('image/png');
    imageArrayForUndo.fill(null);
    for(var i = 0; i < tempArray.length; ++i){
      imageArrayForUndo.push(tempArray[i]);
      imageArrayForUndo.shift();
    }
    imageArrayForUndo.push(currentImage);
    imageArrayForUndo.shift();
    currentPlaceInUndoArray = imageArrayForUndo.length - 1;
  }
  else{
    var tempImageForInserting = new Image();
    tempImageForInserting.src = context.canvas.toDataURL('image/png');
    imageArrayForUndo.push(tempImageForInserting);
    imageArrayForUndo.shift();
  }
}

// Here is the function that clears all of the history out of the undo array:
function clearUndoHistory(){
  // 1. fill array with nulls, 2. grab current image and insert it in last slot, 3. re-set 
  // currentPlaceInUndoArray to imageArrayForUndo.length - 1
  imageArrayForUndo.fill(null);
  var tempImageForInserting = new Image();
  tempImageForInserting.src = context.canvas.toDataURL('image/png');
  imageArrayForUndo.push(tempImageForInserting);
  imageArrayForUndo.shift();
  currentPlaceInUndoArray = imageArrayForUndo.length - 1;
}


function tellUserToSelectAnAreaFirst(){
  // open up a window telling the user to select an area.
  alert('Please use the Select tool to select a region first.', '');
}

function tellUserToCopySomethingFirst(){
  alert('Error: You have not yet copied a region of the whiteboard, thus nothing to paste yet.', ' ');
}


// This function was taken from:
// http://stackoverflow.com/a/26230989
// I appreciate basil's work!!! It works perfectly where nothing else did!
// It essentially returns the current location of the top left corner of 
// the applicable element regardless of where it is in the scrollable
// area. The coordinates returned are relative to the top left corner of
// the main window. This is great for the modal dialogs, because once
// this location is known, the combination of it and the location of the
// click can be used to calculate the location of the click on the element.
function getCoords(elem){ // cross browser version
  var box = elem.getBoundingClientRect();

  var body = document.body;
  var docEl = document.documentElement;

  var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
  var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

  var clientTop = docEl.clientTop || body.clientTop || 0;
  var clientLeft = docEl.clientLeft || body.clientLeft || 0;

  var top  = box.top +  scrollTop - clientTop;
  var left = box.left + scrollLeft - clientLeft;

  return { top: Math.round(top), left: Math.round(left) };
}


// This function was taken from:
// https://jsfiddle.net/Lnyxuchw/
// Which was referenced in a post by Panama Prophet located at:
// http://stackoverflow.com/a/41635312
// I appreciate the work of Panama Prophet or whomever created
// this function. It seems to work quite well for validating PNG
// images before they are loaded. I have also added the try-catch
// structure so that if the string is not a base64 string, the
// function correctly returns false instead of throwing an exception.

function checkPNGImage(base64string){
  var src = base64string;
  var imageData = [];
  try{
    imageData = Uint8Array.from(atob(src.replace('data:image/png;base64,', '')), c => c.charCodeAt(0));
  }
  catch(err){
    // If the string cannot even be decoded correctly, there is no reason to continue checking it,
    // since it will obviously be invalid:
    return false;
  }
  if(imageData.length < 12){
    return false;
  }
  var sequence = [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]; // in hex: 

  // check the last 12 elements of the array to see if they contain the correct values:
  for(var i = 12; i > 0; i--){
    if(imageData[imageData.length - i] !== sequence[12 - i]){
      // If any incorrect values are found, immediately return false:
      return false;
    }
  }
  return true;
}
