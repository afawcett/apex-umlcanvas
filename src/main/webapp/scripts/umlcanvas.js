var UMLCANVAS_VERSION = "development";

var scripts = [ 
    "/scripts/umlcanvas/lib/Canvas2D.standalone.js",
    "/scripts/umlcanvas/DepCheck.js",
    "/scripts/umlcanvas/UmlCanvas.js",
    "/scripts/umlcanvas/Common.js",
    "/scripts/umlcanvas/Manager.js",
    "/scripts/umlcanvas/Model.js",
    "/scripts/umlcanvas/Diagram.js",
    "/scripts/umlcanvas/Class.js",
    "/scripts/umlcanvas/Attribute.js",
    "/scripts/umlcanvas/Operation.js",
    "/scripts/umlcanvas/Parameter.js",
    "/scripts/umlcanvas/ConnectorHeads.js",
    "/scripts/umlcanvas/Association.js",
    "/scripts/umlcanvas/Role.js",
    "/scripts/umlcanvas/Dependency.js",
    "/scripts/umlcanvas/ClientSupplier.js",
    "/scripts/umlcanvas/Interface.js",
    "/scripts/umlcanvas/Inheritance.js",
    "/scripts/umlcanvas/Realization.js",
    "/scripts/umlcanvas/Enumeration.js",
    "/scripts/umlcanvas/Note.js",
    "/scripts/umlcanvas/NoteLink.js",
    "/scripts/umlcanvas/StateDiagrams.js",
    "/scripts/umlcanvas/Widget.js",
    "/scripts/umlcanvas/KickStart.js",
    "/scripts/umlcanvas/PluginManagerRepository.js",
    "/scripts/umlcanvas/Defaults.js",
    "/scripts/umlcanvas/Config.js"
];

var count = 0;

function addScript(url) {
  document.writeln( "<script type=\"text/javascript\" src=\"" + url + "\"></script>" );
}

function loadScripts() {
  for( var i=0; i<scripts.length; i++ ) {
	  addScript(scripts[i]);
  }
}

loadScripts();
