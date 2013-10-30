//Requirements
//JQuery
//JQuery UI

//TO-DO: 
// also see if we can still get parameters if we disable node support for the iframe with nwdisable( is this correct tag?)

// Get menu items working
// Midi binding
// Background color of output
// Transparency of layers
// Option to have no crossfade?
// Option to remove a layer again
// Option to hide a layer
// right click menu lets you add an url as a source (or drop a webloc or url format file)
// in source file you can specify a layer thumbnail
// Currently there is an error creating parameters in group B is the same file is already in group A

//I have tried to follow this design pattern
//http://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript

//////////////
// app
//////////////
global.app = (function () {
    var OutputWindow;
    var OutputDocument;
    var gui = require('nw.gui');

    // initialize
    var init = function () {
        var filedrag = [];

        //Open output window
        OutputWindow = openOutputWindow();

        OutputWindow.on('loaded', function() {
            OutputDocument = OutputWindow.window.document;
        });

        //create menus
        global.app.menus.init();

        //Create context menu
        global.app.menus.contextMenu(gui.Window.get());
 
        //Get DOM elements for file drop zones
        filedrag[0] = $("#filedrag1")[0];
        filedrag[1] = $("#filedrag2")[0];

        // file drop
        for(var i in filedrag) {
            global.app.util.BindFileDropZone(filedrag[i], OutputWindow);
        }

        //Prevent file drop in rest of the window
        document.body.addEventListener("drop", function(e) {
            e.preventDefault();
        }, false);

        // Initialize JQuery UI elements
        initUI();
    }

    var initUI = function () {
        $( "#slider_mainCrossfader" ).slider();
        $( "#slider_mainCrossfader" ).on( "slide", mainCrossfaderSlide);
    }

    /////// UI events /////

    var mainCrossfaderSlide = function (event, ui) {
        //Apply crossfader value
        doMainCrossfade(ui.value/100);
    }

    ////// Actions in the output /////////

    // Value should be between 0-1
    var doMainCrossfade = function (value) {
        $("#frame1", OutputDocument).css({ opacity: 1 - value });
        $("#frame2", OutputDocument).css({ opacity: value });
    }

    //Open output window
    var openOutputWindow = function () {
       var gui, outputWin;

        // Load native UI library
        gui = require('nw.gui');

        outputWin = gui.Window.open('output.html', {
            x: 100,
            y: 100,
            width: 800,
            height: 600,
            frame: true
        });

        return outputWin;
    }

    // output information
    var Output = function (msg) {
        $("#messages").html(msg);
    }

  //---------- Input parameters ---------------

  //Create sliders in html
  function createInputParameters(outputLayerWindow, sourceFrame) {
    var parameters, item, step, minVal, maxVal, divBox, title, divInput, jQslider, data, input, rootDiv;
    if (!outputLayerWindow.appInputParameters) {
      console.log("no input parameters found");
      console.log(outputLayerWindow);
    }
    parameters = outputLayerWindow.appInputParameters;
    rootDiv = sourceFrame == "#frame1" ? "#groupAParameters" : "#groupBParameters";
    $(rootDiv).html("");
    for (item in parameters){
      if (parameters[item].type == "number") {
        step = 0.01 * (parameters[item].maxValue - parameters[item].minValue);
        minVal = parameters[item].minValue;
        maxVal = parameters[item].maxValue;
        divBox = $('<div>')
            .attr('class', 'sliderBox')
            .appendTo(rootDiv);
        title = $('<div>')
            .attr('class', 'uiTitle')
            .text(parameters[item].label)
            .appendTo(divBox);
        divInput = $('<div>')
            .attr('id', 'slider'+item)
            .appendTo(divBox);
        jQslider = $("#" + "slider" + item).slider({ 
            min: minVal, 
            max: maxVal, 
            step: step,
            value: parameters[item].value
        });
        //data element for jquery event binding. Appears as e.data object
        data = { 
            parameter: item,
            frameWindow: outputLayerWindow,
            valueType: "float"
                    };
        jQslider.bind("slide", data, updateControl);
      }
      if (parameters[item].type == "text") {
        divBox = $('<div>')
            .attr('class', 'textBox')
            .appendTo(rootDiv);
        title = $('<div>')
            .attr('class', 'uiTitle')
            .text(parameters[item].label)
            .appendTo(divBox);
        divInput = $('<div>')
            .appendTo(divBox);
        input = $('<input type="text"/>').appendTo(divInput);
        input.attr("id", 'text'+item);
        //data element for jquery event binding. Appears as e.data object
        data = { 
            parameter: item,
            frameWindow: outputLayerWindow,
            valueType: "text"
                    };
        input.bind("change", data, updateControl);
      }
    }
  }    

  //Update the value of a html control
  function updateControl(e,ui) {
    var value = e.target.value || ui.value;
    //console.log(ui);
    //console.log(e.target.value);
    //detect type of input.....
    if (e.data.valueType == "float")
        e.data.frameWindow.appInputParameters[e.data.parameter].value = parseFloat(value);
    else if (e.data.valueType == "text")
        e.data.frameWindow.appInputParameters[e.data.parameter].value = value;
    console.log("parameters");
    console.log(e.data.frameWindow.appInputParameters);
  }

    ////// Event binding /////////
    document.addEventListener( "DOMContentLoaded", init, false )

    //Public methods
    return {
        getOutputWindow: function () { return OutputWindow; },
        updateControl: updateControl,
        createInputParameters: createInputParameters
    }

})(); //End of global.app

//////////////
// Util
//////////////
global.app.util = (function () {
    var targetWindow;

    //Binds the events needed for file drag and drop to work
    var BindFileDropZone = function (element, theWindow) {
            targetWindow = theWindow;
            element.addEventListener("dragover", fileDragHover, false);
            element.addEventListener("dragleave", fileDragHover, false);
            element.addEventListener("drop", fileSelectHandler, false);
    }

    //Takes a screenshot and places it as a background image of a DOM element
    //Note that this opens the url in a temporary hidden window to do this
    var takeScreenshotToBackgroundImage = function (url, jQueryId) {
        var newWin = openHiddenWindow(url,0,0,400,300);
        newWin.on('loaded', function() {
            newWin.window.setTimeout(function() {
                //Calling function when captured image is ready
                newWin.capturePage(function(imgDataUrl) {
                    newWin.close(true);
                    insertBackgroundImage(imgDataUrl, jQueryId);      
                }, 'png');
            },1000); //Delay to ensure page is loaded
            
        });
    }

    //Inserts an imageUrl as background image of a DOM element
    var insertBackgroundImage = function (imgUrl, jQueryId) {
        $(jQueryId).css('background-image', 'url(' + imgUrl + ')'); 
    }

    //Opens a hidden nw window and returns the object
    var openHiddenWindow = function (url,x,y,width,height) {
        // Load native UI library
        var gui = require('nw.gui');

        return gui.Window.open(url, {
            x: x,
            y: y,
            width: width,
            height: height,
            frame: false,
            show: false
        });
    }

    // file drag hover
    var fileDragHover = function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.target.className = (e.type == "dragover" ? "hover" : "");
    }

    // Opens file content in iframe
    var parseFile = function (file, dropZoneJQueryId, iFrameJQueryId) {
        var parameters, outputDom;

        takeScreenshotToBackgroundImage("file://" + file.path, dropZoneJQueryId);

        outputDom = targetWindow.window.document;

        $(iFrameJQueryId, outputDom).load(function(){
            global.app.createInputParameters($(iFrameJQueryId, outputDom)[0].contentWindow, iFrameJQueryId);
        });

        $(iFrameJQueryId, outputDom).attr('src', file.path);
    }

    // Handles what happens when a file is dropped
    var fileSelectHandler = function(e) {
        // cancel event and hover styling. prevent dropped file from loading in the window
        fileDragHover(e);

        // fetch FileList object
        var files = e.target.files || e.dataTransfer.files;

        var dropZoneJQueryId = "#" + this.id;
        var targetIFrameJQueryId = $(dropZoneJQueryId).attr("appTargetFrameId");

        parseFile(files[0],dropZoneJQueryId, targetIFrameJQueryId);
    }

    //Public methods
    return {
         BindFileDropZone: BindFileDropZone
    }
})(); //End of global.app.fileUtil

//////////////
// Menus
//////////////
global.app.menus = (function () {
    var gui = require('nw.gui');

    function init() {
        var outputWin = global.app.getOutputWindow();

        //------ Output -----------
        var outputMenu = new gui.MenuItem({
          label: 'Output'
        });
        var outputSubmenu = new gui.Menu();
        outputMenu.submenu = outputSubmenu;

        // Create menu items and their functions
        var itemShow = new gui.MenuItem({
          label: "Show Output Window",
          click: function() {
            outputWin.show()
          }
        });
        outputSubmenu.append(itemShow);

        var itemHide = new gui.MenuItem({
          label: "Hide Output Window",
          click: function() {
            outputWin.hide()
          }
        });
        outputSubmenu.append(itemHide);

        var itemEnterFullscreen = new gui.MenuItem({
          label: "Enter Fullscreen",
          click: onEnterFullscreen
        });
        outputSubmenu.append(itemEnterFullscreen);

        var itemExitFullscreen = new gui.MenuItem({
          label: "Exit Fullscreen",
          click: onExitFullscreen
        });
        outputSubmenu.append(itemExitFullscreen);

        outputSubmenu.append(new gui.MenuItem({
          type: 'separator'
        }));

        //----------- Attach to menu -----------
        var mainMenu = new gui.Menu({
          type: 'menubar'
        });
        mainMenu.append(outputMenu);
        gui.Window.get().menu = mainMenu;
      }

      //--------- Menu item events -------------

      function onDevTools(theWindow) {
        theWindow.showDevTools();
      }

      function onHideStats() {
        if (outputWin.window.document.getElementById("stats")) {
          outputWin.window.document.getElementById("stats").style.display = "none";
        }
      }

      function onExitFullscreen() {
        setOutputWindowPropertiesWhenNotFullscreen();
        outputWin.unmaximize();
        outputWin.resizeTo(outputWinProperties.width, outputWinProperties.height);
        outputWin.moveTo(outputWinProperties.x, outputWinProperties.y);
      }

      function onEnterFullscreen() {
        outputWinProperties.x = outputWin.window.screenX;
        outputWinProperties.y = outputWin.window.screenY;
        outputWinProperties.width = outputWin.window.outerWidth;
        outputWinProperties.height = outputWin.window.outerHeight;
        setOutputWindowPropertiesWhenFullscreen();
        outputWin.maximize();
      }

      ///// Context menu /////
      function contextMenu(nwWindow) {
            //Create context menu
            var contextMenu = new gui.Menu();
            // Create menu item and its functions
            var itemDevTools = new gui.MenuItem({
              label: "Developer Tools",
              click: function () { onDevTools(nwWindow) }
            });
            contextMenu.append(itemDevTools);

            nwWindow.window.document.body.addEventListener('contextmenu', function(ev) { 
                ev.preventDefault();
                contextMenu.popup(ev.x, ev.y);
                return false;
            });
      }

      return {
        init:init,
        contextMenu: contextMenu
      }
})();
