# Natively play video streams in Firefox

This is a fork of [antoniy's extenstion](https://github.com/antoniy/mpv-youtube-dl-binding).

IMHO only problem that I face with antoniy's extension is that it doesnot allow user to select the format. 
Ofcourse we can use additional player parameters e.g. --ytdl-format=bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a] but different websites have different bitrate videos for same resolution and it is inconvenient to change additional player parameters each time.

This extension allows user to select the available format before launching mpv.

The implementation of selecting format is shamelessly copied from [IsSuEat's extension](https://github.com/IsSuEat/open-livestreamer-firefox-addon)

Obviously this addon is not signed.

### Build it manually
1. Download the source.
2. Download de [Add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm#Installation).
3. Run `jpm xpi` inside the `project` directory.
4. Open the `mpv-youtubedl-firfox-addon.xpi` file with Firefox developer edition.
