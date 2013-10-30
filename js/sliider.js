//Requirements
//JQuery
//JQuery UI

// Supported environments:
// Node-webkit
// CefWithSyphon

// To-do
// Get menu items working
// show stats menu item
// Midi binding
// Background color of output
// Transparency of layers
// Option to have no crossfade?
// Option to remove a layer
// Option to hide a layer
// drop webloc on dropzone to open url
// problem with screenshot the second time the same old img is displayed
// two tabs in open dialog file/url
// collapsable parameter groups
// CEF: App pauses while dialog is open
// Perhaps the slii.inputs can have some utility functions / values e.g. to let user get the id of the UI element?

//!!!!!!
// What happens when user clicks cancel in file dialog? CEF problem but also check NW

//////////////
// Sliider app
//////////////
sliider = {
    OutputDom: {},
    OutputWindow: {},
};

//node-webkit
if (typeof require !== "undefined")
    sliider.gui = require('nw.gui');

//node-webkit specific stuff
sliider.nw = {
    OutputNwWindow: {},
    OutputWinSettings: {},    
};


sliider.init = function () {
    if (typeof require !== "undefined") {
        //node-webkit
        //Open output window
        sliider.nw.openOutputWindow();
        //create menus
        sliider.menubar.init();
        //Configure controls window with nw specific stuff
        sliider.nw.controlsInit();
    } else {
        //not node-webkit - output window is already open
        sliider.OutputWindow = window.opener;
        sliider.OutputDom = window.opener.document;
        //Configure controls window
        sliider.controls.init();

    }
}


sliider.showParameters = function () {
    //Note that 'this' refers to a dropzone element when called as an event handler of that element
    var parameterID = this.id == "filedrag1" ? "#Parameters1" : "#Parameters2";
    $("#Parameters1").hide();
    $("#Parameters2").hide();
    $(parameterID).show();
    $("#filedrag1").css('border', "");
    $("#filedrag2").css('border', "");
    $("#" + this.id).css('border', "2px solid #0b93d5");
}

/////// UI events /////

sliider.mainCrossfaderSlide = function (event, ui) {
    //Apply crossfader value
    sliider.doMainCrossfade(ui.value/100);
}

////// Actions in the output /////////

// Value should be between 0-1
sliider.doMainCrossfade = function (value) {
    $("#frameGroupA", sliider.OutputDom).css({ opacity: 1 - value });
    $("#frameGroupB", sliider.OutputDom).css({ opacity: value });    
}

// One of the 'Open' buttons were clicked
sliider.dialogOpen = function(event) {
    var clickedId = event.currentTarget.id;
    console.log("We are in dialogOpen and clickedId = ", clickedId);
    var targetIFrameJQueryId = $("#" + clickedId).attr("apptargetframeid");
    var dropZoneJQueryId = $("#" + clickedId).attr("appdropzoneid");

    // Set custom attributes on the dialog html div in order for the
    //'open file' button to know the context.
    $( "#dialogOpen" ).attr("apptargetframeid", targetIFrameJQueryId);
    $( "#dialogOpen" ).attr("appdropzoneid", dropZoneJQueryId);

    $( "#dialogOpen" ).dialog({
      resizable: false,
      height:160,
      modal: true,
      buttons: {
        "Open": function() {
          $( this ).dialog( "close" );
          var url = $( "#dialogOpenfield" ).val();
          sliider.util.openWebUrl(url, dropZoneJQueryId, targetIFrameJQueryId);
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      }
    });
}

sliider.openFile = function() {
    //Get a custom attribute that tells us which of the iframe layers the file should open in
    var targetIFrameJQueryId = $( "#dialogOpen" ).attr("apptargetframeid");
    var dropZoneJQueryId = $( "#dialogOpen" ).attr("appdropzoneid");

    console.log("we are in openFile and targetIFrameJQueryId =", targetIFrameJQueryId);

    if (typeof require == "undefined") {
        sliider.util.cef.localFileIntoIframe(targetIFrameJQueryId, dropZoneJQueryId);
    } else {
        sliider.util.nw.localFileIntoIframe(targetIFrameJQueryId, dropZoneJQueryId);
    }
}

//---------- Input parameters ---------------

//Create sliders in html
sliider.createInputParameters = function (outputLayerWindow, sourceFrame) {
    var parameters, item, step, minVal, maxVal, divBox, title, divInput, jQslider, jQInputSelector, data, input, rootDiv, divHtml, content, label;
    var paramId = sourceFrame == "#frame1" ? "A" : "B";
    rootDiv = sourceFrame == "#frame1" ? "#Parameters1 .parameters" : "#Parameters2 .parameters";
    //console.log($("#Parameters1 .parameters")[0]);
    $(rootDiv).html("");
    if (outputLayerWindow.slii == undefined || outputLayerWindow.slii.inputs == undefined) {
        $(rootDiv).html("No parameters found in file");
    } else {
        parameters = outputLayerWindow.slii.inputs;
        for (item in parameters) {

          if (parameters[item].hasOwnProperty('type') && parameters[item].type == "number") {
            step = 0.01 * (parameters[item].maxValue - parameters[item].minValue);
            minVal = parameters[item].minValue;
            maxVal = parameters[item].maxValue;
            divBox = $('<div>')
                .attr('class', 'uiElement sliderBox')
                .appendTo(rootDiv);
            title = $('<div>')
                .attr('class', 'uiTitle')
                .text(parameters[item].label)
                .appendTo(divBox);
            divInput = $('<div>')
                .attr('id', 'slider' + item)
                .appendTo(divBox);
            //Look for #sliderParametername elements only inside the #rootDiv element
            jQslider = $("#" + "slider" + item, rootDiv).slider({ 
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
            jQslider.bind("slide", data, sliider.updateControl);
          }

        if (parameters[item].type == "text") {
            divBox = $('<div>')
                .attr('class', 'uiElement textBox')
                .appendTo(rootDiv);
            title = $('<div>')
                .attr('class', 'uiTitle')
                .text(parameters[item].label)
                .appendTo(divBox);
            divInput = $('<div>')
                .appendTo(divBox);
            input = $('<input type="text"/>').appendTo(divInput);
            input.attr("id", 'text'+item);
            input.attr("class","ui-widget-content ui-corner-all");
            //data element for jquery event binding. Appears as e.data object
            data = { 
                parameter: item,
                frameWindow: outputLayerWindow,
                valueType: "text"
                        };
            input.bind("change", data, sliider.updateControl);
          }

          if (parameters[item].type == "toggle") {
            divBox = $('<div>')
                .attr('class', 'uiElement toggleButton')
                .appendTo(rootDiv);
            divInput = $('<div>')
                .appendTo(divBox);
            input = $('<input type="checkbox">').appendTo(divInput);
            if (parameters[item].value == 1) {
                input.attr("checked", "checked");
            }
            input.attr("id", "toggle" + item + paramId);
            label = $('<label>')
                .attr("for", "toggle" + item + paramId)
                .text(parameters[item].label)
                .appendTo(divInput);

            input.button(); //Sets jqueryUi button style
            data = { 
                parameter: item,
                frameWindow: outputLayerWindow,
                valueType: "boolean"
            };
            input.bind("click", data, sliider.updateControl);
          }

          //Perhaps put html in an iframe to encapsulate it better?
          if (parameters[item].type == "html") {
                divBox = $("<div>")
                .attr("class", "uiElement customHtml")
                .appendTo(rootDiv);
                if (parameters[item].label) {
                    title = $('<div>')
                        .attr('class', 'uiTitle')
                        .text(parameters[item].label)
                        .appendTo(divBox);
                }
                divHtml = $('<div>')
                    .appendTo(divBox);
                content = $(parameters[item].value).appendTo(divHtml); 
           }

           //Dropdown
           if (parameters[item].type == "dropdown") {
               divBox = $("<div>")
                    .attr("class", "uiElement dropdown")
                    .appendTo(rootDiv);
                title = $('<div>')
                    .attr('class', 'uiTitle')
                    .text(parameters[item].label)
                    .appendTo(divBox);
                divDropDown = $('<div>')
                    .appendTo(divBox);
                var select = $('<select>')
                    .appendTo(divDropDown);
                select.attr("id", 'dropdown'+item);
                select.attr("class", "ui-widget-content");
                for (var i in parameters[item].options) {
                    var inputsItem = parameters[item].options[i];
                    var option = $("<option>")
                        .attr("value", inputsItem.value)
                        .text(inputsItem.text)
                        .appendTo(select);
                }
                //data element for jquery event binding. Appears as e.data object
                data = { 
                    parameter: item,
                    frameWindow: outputLayerWindow,
                    valueType: "dropdown"
                };
                select.bind("change", data, sliider.updateControl);
           }           
        }
    }
}  

//Update the value of input parameters when a html control is touched
sliider.updateControl = function (e,ui) {
    var value = e.target.value || ui.value;
    //console.log(ui);
    //console.log(e);
    //detect type of input.....
    if (e.data.valueType == "float")
        e.data.frameWindow.slii.inputs[e.data.parameter].value = parseFloat(value);
    else if (e.data.valueType == "text")
        e.data.frameWindow.slii.inputs[e.data.parameter].value = value;
    else if (e.data.valueType == "boolean")
        e.data.frameWindow.slii.inputs[e.data.parameter].value = $(this).is(":checked") ? 1 : 0;
    else if (e.data.valueType == "dropdown")
        e.data.frameWindow.slii.inputs[e.data.parameter].value = value;
    //Trigger callback function if it exists
    if (e.data.frameWindow.slii.inputs[e.data.parameter].onChange) {
        e.data.frameWindow.slii.inputs[e.data.parameter].onChange();
    }
}

///////////////
// Node-webkit specific stuff
///////////////

//Open output window
sliider.nw.openOutputWindow = function () {
   var gui, outputWin;

    // Load native UI library
    gui = require('nw.gui');

    sliider.nw.OutputNwWindow = gui.Window.open('output.html', {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        frame: false
    });

    sliider.nw.OutputNwWindow.on('loaded', function() {
        sliider.OutputDom = sliider.nw.OutputNwWindow.window.document;
    });
}

//Init things in the controls window that are specific to node-webkit
sliider.nw.controlsInit = function() {
//sliider.controls.init = function() {
    var i;

    //General init for the controls window
    sliider.controls.init();

    //Create context menu
    sliider.controls.contextMenu(sliider.gui.Window.get());

    // file drop area
    sliider.util.BindFileDropZone($("#filedrag1")[0], sliider.nw.OutputNwWindow);
    sliider.util.BindFileDropZone($("#filedrag2")[0], sliider.nw.OutputNwWindow);

    //Prevent file drop in rest of the window
    document.body.addEventListener("drop", function(e) {
        e.preventDefault();
    }, false);

    //Bind handler for 'file open' dialog
    $("#nwFileDialog").change(function(evt) {
        var targetIFrameJQueryId = $( "#dialogOpen" ).attr("apptargetframeid");
        var fileUrl = $(this).val();
        $(targetIFrameJQueryId, sliider.OutputDom).attr('src', fileUrl);
        //Close jQuery 'Open' dialog
        $( "#dialogOpen" ).dialog("close");
    });
}

//////////////
// Controls window
//////////////
sliider.controls = {}

sliider.controls.init = function () {
    $( "#slider_mainCrossfader" ).slider();
    $( "#slider_mainCrossfader" ).on( "slide", sliider.mainCrossfaderSlide);
    $( "#urlButtonA" ).button();
    $( "#urlButtonB" ).button();
    $( "#urlButtonA" ).on( "click", sliider.dialogOpen);
    $( "#urlButtonB" ).on( "click", sliider.dialogOpen);

    // click layer icon to show/hide parameters
    $("#filedrag1")[0].addEventListener("click", sliider.showParameters, false);
    $("#filedrag2")[0].addEventListener("click", sliider.showParameters, false);

    //Button in Open dialog
    $( "#dialogOpenFile" ).button();
    $( "#dialogOpenFile" ).on( "click", sliider.openFile);

    sliider.util.jqueryUiStylesModify();
}

///// Context menu /////
sliider.controls.contextMenu = function (nwWindow) {
    //Create context menu
    var contextMenu = new sliider.gui.Menu();
    // Create menu item and its functions
    var itemDevTools = new sliider.gui.MenuItem({
      label: "Developer Tools",
      click: function () { sliider.menubar.onDevTools(nwWindow) }
    });
    contextMenu.append(itemDevTools);

    nwWindow.window.document.body.addEventListener('contextmenu', function(ev) { 
        ev.preventDefault();
        contextMenu.popup(ev.x, ev.y);
        return false;
    });
}

////// Event binding /////////
document.addEventListener( "DOMContentLoaded", sliider.init, false );