//////////////
// Util
//////////////
sliider.util = {
    targetWindow: {}
}


//Binds the events needed for file drag and drop to work
sliider.util.BindFileDropZone = function (element, theWindow) {
    sliider.util.targetWindow = theWindow;
    element.addEventListener("dragover", sliider.util.fileDragHover, false);
    element.addEventListener("dragleave", sliider.util.fileDragHover, false);
    element.addEventListener("drop", sliider.util.fileSelectHandler, false);
}

//Takes a screenshot and places it as a background image of a DOM element
//Note that this opens the url in a temporary hidden window to do this
sliider.util.takeScreenshotToBackgroundImage = function (url, jQueryId) {
    var newWin = sliider.util.openHiddenWindow(url,0,0,400,300);
    newWin.on('loaded', function() {
        newWin.window.setTimeout(function() {
            //Calling function when captured image is ready
            newWin.capturePage(function(imgDataUrl) {
                newWin.close(true);
                sliider.util.insertBackgroundImage(imgDataUrl, jQueryId);      
            }, 'png');
        },1000); //Delay to ensure page is loaded
        
    });
}

//Inserts an imageUrl as background image of a DOM element
sliider.util.insertBackgroundImage = function (imgUrl, jQueryId) {
    $(jQueryId).css('background-image', 'url(' + imgUrl + ')'); 
}

//Opens a hidden nw window and returns the object
sliider.util.openHiddenWindow = function (url,x,y,width,height) {
    return sliider.gui.Window.open(url, {
        x: x,
        y: y,
        width: width,
        height: height,
        frame: false,
        show: false
    });
}

// file drag hover
sliider.util.fileDragHover = function (e) {
    e.stopPropagation();
    e.preventDefault();
    e.target.className = (e.type == "dragover" ? "hover" : "");
}

// Opens file content in iframe
sliider.util.parseFile = function (file, dropZoneJQueryId, iFrameJQueryId) {
    var parameters, outputDom;

    sliider.util.takeScreenshotToBackgroundImage("file://" + file.path, dropZoneJQueryId);

    outputDom = sliider.util.targetWindow.window.document;

    $(iFrameJQueryId, outputDom).load(function(){
        sliider.createInputParameters($(iFrameJQueryId, outputDom)[0].contentWindow, iFrameJQueryId);
    });

    $(iFrameJQueryId, outputDom).attr('src', file.path);
}

// Handles what happens when a file is dropped
sliider.util.fileSelectHandler = function(e) {
    var files, dropZoneJQueryId, targetIFrameJQueryId;
    // cancel event and hover styling. prevent dropped file from loading in the window
    sliider.util.fileDragHover(e);

    // fetch FileList object
    files = e.target.files || e.dataTransfer.files;

    dropZoneJQueryId = "#" + this.id;
    targetIFrameJQueryId = $(dropZoneJQueryId).attr("appTargetFrameId");

    sliider.util.parseFile(files[0],dropZoneJQueryId, targetIFrameJQueryId);
}