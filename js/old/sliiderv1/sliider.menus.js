//////////////
// Menus
//////////////
sliider.menus = {}
sliider.menus.init = function() {
    var gui = sliider.gui;
    var outputWin = sliider.OutputWindow;

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
      click: function() { sliider.menus.onEnterFullscreen() }
    });
    outputSubmenu.append(itemEnterFullscreen);

    var itemExitFullscreen = new gui.MenuItem({
      label: "Exit Fullscreen",
      click: function() { sliider.menus.onExitFullscreen() }
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

sliider.menus.onDevTools = function (theWindow) {
    theWindow.showDevTools();
}

//TO-DO
sliider.menus.onHideStats = function () {
    if (outputWin.window.document.getElementById("stats")) {
      outputWin.window.document.getElementById("stats").style.display = "none";
    }
  }

sliider.menus.onExitFullscreen = function () {
    var nwWin = sliider.OutputWindow;
    var settings = sliider.OutputWinSettings;
    nwWin.focus();
    nwWin.unmaximize();
    //Let user drag window
    nwWin.window.document.body.style.WebkitAppRegion = "drag";
    nwWin.resizeTo(settings.width, settings.height);
    nwWin.moveTo(settings.x, settings.y);
    nwWin.setResizable(true);
    nwWin.setAlwaysOnTop(false);
  }

sliider.menus.onEnterFullscreen = function () {
    var nwWin = sliider.OutputWindow;
    var settings = {};
    settings.x = nwWin.window.screenX;
    settings.y = nwWin.window.screenY;
    settings.width = nwWin.window.outerWidth;
    settings.height = nwWin.window.outerHeight;
    sliider.OutputWinSettings = settings;
    nwWin.setAlwaysOnTop(true);
    //Prevent user from dragging window
    nwWin.window.document.body.style.WebkitAppRegion = "no-drag";
    nwWin.focus();
    nwWin.maximize();
    nwWin.setResizable(false);
  }

///// Context menu /////
sliider.menus.contextMenu = function (nwWindow) {
    //Create context menu
    var contextMenu = new sliider.gui.Menu();
    // Create menu item and its functions
    var itemDevTools = new sliider.gui.MenuItem({
      label: "Developer Tools",
      click: function () { sliider.menus.onDevTools(nwWindow) }
    });
    contextMenu.append(itemDevTools);

    nwWindow.window.document.body.addEventListener('contextmenu', function(ev) { 
        ev.preventDefault();
        contextMenu.popup(ev.x, ev.y);
        return false;
    });
}