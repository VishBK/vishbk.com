var lastFMData = {
  baseURL: "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=",
  user: "VishBK", // Last.fm username
  apiKey: "84a282a51ad5840993f942428d0b50db",
  optionalParams: "&format=json&limit=1"
};

var getSetLastFMData = function () {
  $.ajax({
      type : "GET",
      url : 
          lastFMData.baseURL + 
          lastFMData.user + 
          "&api_key=" + 
          lastFMData.apiKey + 
          lastFMData.optionalParams,
      dataType: "json",
      success : function(data) {            
          var recentTrack = data.recenttracks.track[0];
          if (recentTrack.hasOwnProperty("@attr")) {  // Check if @attr and therefore nowplaying exists
              $("#listeningTitle").html("Listening To");
              $("#musicBars").css("visibility", "visible");
          } else {
              $("#listeningTitle").html("Last Listened To");
              $("#musicBars").css("visibility", "hidden");
          }
          var imageSrc = recentTrack.image[3]["#text"];
          $("#trackArt").attr("src", imageSrc);
          //var rgb = getImageColor(imageSrc);
          $("#trackTitle").html(recentTrack.name);
          $("#trackArtist").html(recentTrack.artist["#text"]);
          //$(".bar").css("background-color", "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.75)");
      },
      error : function(code, message) {
      }
  })
}

function getImageColor(imageSrc) {
    const colorThief = new ColorThief();
    const img = new Image();
    img.src = imageSrc;

    // Make sure image is finished loading
    if (img.complete) {
        return colorThief.getColor(img);
    } else {
        img.addEventListener("load", function() {
            return colorThief.getColor(img);
        });
    }
}

getSetLastFMData();
setInterval(getSetLastFMData, 10 * 1000);