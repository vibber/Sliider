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
        },2000); //Delay to ensure page is loaded
        
    });
}

//Inserts an imageUrl as background image of a DOM element
sliider.util.insertBackgroundImage = function (imgUrl, jQueryId) {
    //console.log("inserting bg img", imgUrl);
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

// // Opens file content in iframe
// sliider.util.parseFile = function (file, dropZoneJQueryId, iFrameJQueryId) {
//     var parameters, outputDom;

//     outputDom = sliider.util.targetWindow.window.document;

//     $(iFrameJQueryId, outputDom).load(function(){
//         //Create parameters
//         sliider.createInputParameters($(iFrameJQueryId, outputDom)[0].contentWindow, iFrameJQueryId);

//         var iframeWindow = $(iFrameJQueryId, outputDom)[0].contentWindow;
//         // Use thumbnail image from disk - otherwise take
//         if (iframeWindow.appIcon) {
//             var path = file.path.split("/");
//             path.pop();
//             var formattedPath = "";
//             path.forEach(function(el) {
//                 formattedPath += encodeURIComponent(el) + "/";
//             });
//             var iconUrl = "file://" + formattedPath + iframeWindow.appIcon;
//             sliider.util.insertBackgroundImage(iconUrl, dropZoneJQueryId);
//         } else {
//             sliider.util.takeScreenshotToBackgroundImage("file://" + file.path, dropZoneJQueryId);
//         }
//     });

//     $(iFrameJQueryId, outputDom).attr('src', file.path);
// }

// Insert app icon image as background image
sliider.util.useIconForBackgroundImage = function(pathPrefix, fullFilePath, dropZoneJQueryId, iframeWindow) {
    var path = fullFilePath.split("/");
    path.pop();
    var formattedPath = "";
    path.forEach(function(el) {
        formattedPath += encodeURIComponent(el) + "/";
    });
    var iconUrl = pathPrefix + formattedPath + iframeWindow.slii.icon;
    sliider.util.insertBackgroundImage(iconUrl, dropZoneJQueryId);
}

// Should be called when a new page is done loading in an iframe
sliider.util.onPageLoadedHandler = function(pathPrefix, fullFilePath, dropZoneJQueryId, iFrameJQueryId, outputDom){
    console.log("we are in onPageLoadedHandler");
    console.log("pathPrefix", pathPrefix, "fullFilePath", fullFilePath, "dropZoneJQueryId", dropZoneJQueryId, "iFrameJQueryId", iFrameJQueryId, "outputDom", outputDom);

    var iframeWindow = $(iFrameJQueryId, outputDom)[0].contentWindow;

    //Create parameters
    sliider.createInputParameters($(iFrameJQueryId, outputDom)[0].contentWindow, iFrameJQueryId);

    // Use thumbnail image from disk - otherwise take a screenshot
    if (iframeWindow.slii != undefined && iframeWindow.slii.icon) {
        sliider.util.useIconForBackgroundImage( pathPrefix, fullFilePath, dropZoneJQueryId, iframeWindow);
    } else {
        //Take screenshot if in node-webkit
        if (typeof require != "undefined") {
            sliider.util.takeScreenshotToBackgroundImage( pathPrefix + fullFilePath, dropZoneJQueryId);
        } else {
            //clear the thubnail that was loaded
            sliider.util.insertBackgroundImage("", dropZoneJQueryId);
        }
    }

    //Modify some jquery ui styles
    sliider.util.jqueryUiStylesModify();
}

// Modify some jqueru UI styles. Really I should modify the theme instead...
sliider.util.jqueryUiStylesModify = function() {
    $(".ui-button-text").css("padding", "0.1em 0.2em");
}

// Opens file content in iframe
sliider.util.parseFile = function (pathPrefix, fullFilePath, dropZoneJQueryId, iFrameJQueryId) {
    var parameters, outputDom;

    outputDom = sliider.OutputDom;

    //When loading of iframe is complete
    $(iFrameJQueryId, outputDom).load(function(){
        sliider.util.onPageLoadedHandler( pathPrefix, fullFilePath, dropZoneJQueryId, iFrameJQueryId, outputDom);
    });

    //console.log("iFrameJQueryId", iFrameJQueryId, "fullFilePath", fullFilePath);

    //Load the content into iframe
    console.log("iFrameJQueryId", iFrameJQueryId);
    console.log("outputDom", outputDom);
    console.log("fullFilePath", fullFilePath);
    $(iFrameJQueryId, outputDom).attr('src', fullFilePath);
}

// Handles what happens when an url has been entered to be opened
sliider.util.openWebUrl = function(url, dropZoneJQueryId, targetIFrameJQueryId) {
    sliider.util.parseFile("", url, dropZoneJQueryId, targetIFrameJQueryId);
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

    sliider.util.parseFile("file://", files[0].path, dropZoneJQueryId, targetIFrameJQueryId);
}

////////////
// CEF specific
////////////
sliider.util.cef = {}

//This opens a file dialog and loads the path into an iframe
//this function uses non standard syntax which is specific to the CEF application
sliider.util.cef.localFileIntoIframe = function(iFrameJQueryId, dropZoneJQueryId) {
  var message = 'DialogTest.FileOpen';

  // Register for the callback from OnFileDialogDismissed in dialog_test.cpp.
  app.setMessageCallback(message, function(msg, paths) {
    var fileUrl = "file://" + paths.join();

    //When loading of iframe is complete
    $(iFrameJQueryId, sliider.OutputDom).load(function(){
        sliider.util.onPageLoadedHandler( "file://", paths.join(), dropZoneJQueryId, iFrameJQueryId, sliider.OutputDom);
    });
    
    //console.log("fileUrl", fileUrl);
    //console.log("iFrameJQueryId", iFrameJQueryId, "sliider.OutputDom", sliider.OutputDom);
    $(iFrameJQueryId, sliider.OutputDom).attr('src', fileUrl);
    
    app.removeMessageCallback(message);
    
    //Close jQuery 'Open' dialog
    $( "#dialogOpen" ).dialog("close");
  });

  // This will result in a call to OnProcessMessageReceived in dialog_test.cpp.
  app.sendMessage(message);
}

///////////
// Node-webkit specific
///////////
sliider.util.nw = {}

sliider.util.nw.localFileIntoIframe = function(iFrameJQueryId, dropZoneJQueryId) {
    //Reset file path
    $("#nwFileDialog").val("");
    $("#nwFileDialog").trigger('click');

    //When loading of iframe is complete
    $(iFrameJQueryId, sliider.OutputDom).load(function(){
        sliider.util.onPageLoadedHandler( "file://", $("#nwFileDialog").val(), dropZoneJQueryId, iFrameJQueryId, sliider.OutputDom);
    });
     
}