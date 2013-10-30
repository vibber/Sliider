//Requirements
//JQuery
//JQuery UI

// Get menu items working
// show stats menu item
// Hide and show parameters when clicking a thumbnail
// Create stacked layers
// Midi binding
// Background color of output
// Transparency of layers
// Option to have no crossfade?
// Option to remove a layer again
// Option to hide a layer
// right click menu lets you add an url as a source (or drop a webloc or url format file)
// in source file you can specify a layer thumbnail
// Currently there is an error creating parameters in group B is the same file is already in group A


//////////////
// Sliider app
//////////////
sliider = {
    OutputWindow: {},
    OutputWinSettings: {},
    OutputDocument: {},
    gui: require('nw.gui')
};

sliider.init = function () {
    var filedrag = [];
    var i;

    //Open output window
    sliider.openOutputWindow();

    sliider.OutputWindow.on('loaded', function() {
        sliider.OutputDocument = sliider.OutputWindow.window.document;
    });

    //create menus
    sliider.menus.init();

    //Create context menu
    sliider.menus.contextMenu(sliider.gui.Window.get());

    //Get DOM elements for file drop zones
    filedrag[0] = $("#filedrag1")[0];
    filedrag[1] = $("#filedrag2")[0];

    // file drop area
    for(var i in filedrag) {
        sliider.util.BindFileDropZone(filedrag[i], sliider.OutputWindow);
        filedrag[i].addEventListener("click", sliider.showParameters, false);
    }

    //Prevent file drop in rest of the window
    document.body.addEventListener("drop", function(e) {
        e.preventDefault();
    }, false);

    // Initialize JQuery UI elements
    sliider.initUI();
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

sliider.initUI = function () {
    $( "#slider_mainCrossfader" ).slider();
    $( "#slider_mainCrossfader" ).on( "slide", sliider.mainCrossfaderSlide);
}

/////// UI events /////

sliider.mainCrossfaderSlide = function (event, ui) {
    //Apply crossfader value
    sliider.doMainCrossfade(ui.value/100);
}

////// Actions in the output /////////

// Value should be between 0-1
sliider.doMainCrossfade = function (value) {
    // $("#frame1", sliider.OutputDocument).css({ opacity: 1 - value });
    // $("#frame2", sliider.OutputDocument).css({ opacity: value });
    $("#frameGroupA", sliider.OutputDocument).css({ opacity: 1 - value });
    $("#frameGroupB", sliider.OutputDocument).css({ opacity: value });    
}

//Open output window
sliider.openOutputWindow = function () {
   var gui, outputWin;

    // Load native UI library
    gui = require('nw.gui');

    sliider.OutputWindow = gui.Window.open('output.html', {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        frame: false
    });
}

// output information
sliider.Output = function (msg) {
    $("#messages").html(msg);
}

//---------- Input parameters ---------------

//Create sliders in html
sliider.createInputParameters = function (outputLayerWindow, sourceFrame) {
    var parameters, item, step, minVal, maxVal, divBox, title, divInput, jQslider, jQInputSelector, data, input, rootDiv;
    rootDiv = sourceFrame == "#frame1" ? "#Parameters1 .parameters" : "#Parameters2 .parameters";
    //console.log($("#Parameters1 .parameters")[0]);
    $(rootDiv).html("");
    if (!outputLayerWindow.appInputParameters) {
        console.log("no param");
        $(rootDiv).html("No parameters found in file");
    }
    parameters = outputLayerWindow.appInputParameters;
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
        input.bind("change", data, sliider.updateControl);
      }
    }
}    

//Update the value of a html control
sliider.updateControl = function (e,ui) {
    var value = e.target.value || ui.value;
    //console.log(ui);
    //console.log(e.target.value);
    //detect type of input.....
    if (e.data.valueType == "float")
        e.data.frameWindow.appInputParameters[e.data.parameter].value = parseFloat(value);
    else if (e.data.valueType == "text")
        e.data.frameWindow.appInputParameters[e.data.parameter].value = value;
}

////// Event binding /////////
document.addEventListener( "DOMContentLoaded", sliider.init, false );