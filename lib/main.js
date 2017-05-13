var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var simple_prefs = require("sdk/simple-prefs");
var ui = require("sdk/ui");
var { env } = require('sdk/system/environment');
const {Cc,Ci} = require("chrome");
var { Hotkey } = require("sdk/hotkeys");
var contextMenu = require("sdk/context-menu");
var querystring = require("sdk/querystring");

var { ToggleButton } = require("sdk/ui/button/toggle"),
    panels           = require("sdk/panel"),
    self             = require("sdk/self"),
    system           = require("sdk/system");

var    iconPath         = "./img/icon_button.png",
    loadingPath      = self.data.load("./img/loading.svg");
	
// The universal button for Open With mpv
var button = ToggleButton({
    id: "open-mpv",
    label: "Play with mpv",
    icon: iconPath,
    onChange: openPanel,
});
	
function openPanel(state) {
    // Check button
    if (state.checked) {
        get_formats(tabs.activeTab.url)
        panel.show({
            position: button
        });
    }
}

// A gernic panel where all content is showed for Open With Livestreamer
// Uses ./js/global.js to build the menus.
var panel = panels.Panel({
    contentURL: "./panel/global.html",
    width: 250,
    height: 97,
    onHide: closePanel,
    contentScriptFile: self.data.url("./js/global.js"),
    contentScriptOptions: {
        loadingPath: loadingPath,
    }
});

function closePanel() {
    // Close button
    button.state("window", {
        checked: false
    });
}

// Listen for click events
panel.port.on("format-selected", function(payload) {
    var url = payload[0];
	var sel_array=payload[1];
	var array_sp=sel_array.split(/\s+/);
	var format=array_sp[0];
	play_video(url,format);
	panel.hide();
});

function play_video(url,format) {
	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
	file.initWithPath(simple_prefs.prefs.player);

	// create an nsIProcess
	var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
	process.init(file);

	var params = simple_prefs.prefs.params;

	if (params)
	    var args = params.split(" ");
    else
        var args = [];
	if (format!=="Default")
	args.push('--ytdl-format='+format);
	

  if (simple_prefs.prefs.ytStartPlAtIndex) {

    // Checks if running on Youtube
    if (url.indexOf("youtube.com") > -1) { // url is Youtube link

      // Parses url params to an object returning object like:
      var qs = querystring.parse(url.split("?")[1]);

      if (qs["list"] && qs["index"]) { // we have the playlist and the video index

        // args could be: ["--video-unscaled=yes","--ytdl-raw-options=format=best"]
        // so checking for ytdl-raw-options
        var ytdlRawOptionsIndex = -1;
        for (var i = 0; i < args.length; i++) {
            if (args[i].indexOf("ytdl-raw-options") > -1) {
              ytdlRawOptionsIndex = i;
              break;
            };
        };

        // Change ytdl-raw-options or add it to args if not exist
        if (ytdlRawOptionsIndex > -1) {
          args[ytdlRawOptionsIndex] += ",yes-playlist=,playlist-start=" + qs["index"];
        } else {
          args.push("--ytdl-raw-options=yes-playlist=,playlist-start=" + qs["index"]);
        };
      };
    };
  };
	
	
	args.push(url);
	// process.run(false, args, args.length);
	console.log(args)
	process.runAsync(args, args.length);
}


function get_formats(url) {
	var path,
		process,
		youtubedl,
		fullData='';
	
	// Notify
    panel.width = 250;
    panel.height = 97;
    panel.port.emit("status", "Validating URL");
    panel.port.emit("loading", true);
	
	// Get Youtube-dl path
	path=simple_prefs.prefs.youtubedl
    // Kill if null
    if (path === null) {
        return;
    }	
	// Create child instance
    process = require("sdk/system/child_process");
    // Spawn a seperate child to validate in youtubedl
    youtubedl = process.spawn(path, ["-F", url]);
    // As the format info comes in, grab the data
    youtubedl.stdout.on('data', function(data) {
	fullData += data;
	});
	// When format capture is finished, send emit
	youtubedl.on("exit", function() {
		
		if (fullData.search("format code")===-1){
            panel.width = 250;
            panel.height = 70;
            panel.port.emit("loading", false);
            panel.port.emit("status", "No Videos Found");
		} else {
			var fullData_array=fullData.split("\n");
			var stindex=0;
			
			for (var i = 0; i < fullData_array.length; i++) {
				array_element=fullData_array[i];
				if (array_element[0]==="[") {
					stindex=stindex+1;
				};
			};
			var format_array=fullData_array.slice(stindex+1);
			format_array[format_array.length-1]="Default";
			panel.width = 500;
            panel.height = 250;
            panel.port.emit("loading", false);
            panel.port.emit("status", "Select Video Quality");
            panel.port.emit("quality", [url, format_array]);
		};
	});
	
};

// Context Menu
// Right-click -> "Play with mpv"
contextMenu.Item({
	label: "Play with mpv",
	image: self.data.url(iconPath),
	context: contextMenu.SelectorContext("a[href], body"),
        contentScript: 'self.on("click", function(node, data) {' +
                       '    var stream = node.href;' +
                       '    if(!node.href) {' +
                       '        stream = window.location.href;' +
                       '    }' +
                       '    self.postMessage(stream);' +
                       '});',
        onMessage: function(streamURL) {
            get_formats(streamURL)
			panel.show({
				position: button
			});
        }   
});

