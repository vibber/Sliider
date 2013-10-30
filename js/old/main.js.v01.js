//Requirements
//JQuery
//JQuery UI

//http://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
//http://answers.oreilly.com/topic/2177-how-to-use-the-module-pattern-in-javascript/

//create app object in global space
var G;
if (!G) {
    G = global;
}
if (!G.app) {
    G.app = {};
}

//On this window loaded
document.addEventListener( "DOMContentLoaded", init, false )

// initialize
function init() {
    var filedrag = [];

    //Open output window if it hasn't been opened already
    if (!G.app.outputWindow) {
        G.app.outputWindow = openOutputWindow();
    }

    //Get DOM elements for file drop zones
    //filedrag[0] = $id(window, "filedrag1");
    //filedrag[1] = $id(window, "filedrag2");
    filedrag[0] = $("#filedrag1")[0];
    filedrag[1] = $("#filedrag2")[0];

    // file drop
    for(var i in filedrag) {
        filedrag[i].addEventListener("dragover", FileDragHover, false);
        filedrag[i].addEventListener("dragleave", FileDragHover, false);
        filedrag[i].addEventListener("drop", FileSelectHandler, false);
    }

    // Initialize JQuery UI elements
    initUI();
}

function initUI() {
    $( "#slider_mainCrossfader" ).slider();
    $( "#slider_mainCrossfader" ).on( "slide", mainCrossfaderSlide);
}

/////// UI events /////

function mainCrossfaderSlide (event, ui) {
    //Apply crossfader value
    doMainCrossfade(ui.value/100);
}

////// Actions in the output /////////

// Value should be between 0-1
function doMainCrossfade(value) {
    //var outputWin = G.app.outputWindow.window;
    //$id(outputWin, "frame1").style.opacity = 1 - value;
    //$id(outputWin, "frame2").style.opacity = value;
    var outputDom = G.app.outputWindow.window.document;
    $("#frame1", outputDom).css({ opacity: 1 - value });
    $("#frame2", outputDom).css({ opacity: value });
}


//Open output window
function openOutputWindow() {
   var gui, outputWin;

    // Load native UI library
    gui = require('nw.gui');

    outputWin = gui.Window.open('output.html', {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        frame: false
    });

    return outputWin;
}

// file selection
function FileSelectHandler(e) {
    // cancel event and hover styling. prevent dropped file from loading in the window
    FileDragHover(e);

    // fetch FileList object
    var files = e.target.files || e.dataTransfer.files;

    ParseFile(files[0],this.id);
}

// output file information
function ParseFile(file,divid) {
    var outputDom = G.app.outputWindow.window.document;
    if (divid == "filedrag1") {
        $("#frame1", outputDom).attr('src', file.path);
        frameDom = $("#frame1", outputDom)[0].contentDocument;
        //$("#frame1", frameDom).css({ background: "transparent" });
    }
    if (divid == "filedrag2") {
        $("#frame2", outputDom).attr('src', file.path);
        //$("#frame2", G.app.outputWindow.window.document)[0].contentDocument.body.style.background = "transparent"
    }
    // if (divid == "filedrag2") {
    //     var frame2 = $id(outputWin, "frame2");
    //     frame2.src = file.path;
    // }
}

// file drag hover
function FileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.target.className = (e.type == "dragover" ? "hover" : "");
}

// output information
function Output(msg) {
    $("#messages").html(msg + m.innerHTML);
}