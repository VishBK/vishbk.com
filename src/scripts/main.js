var myHeading = document.querySelector('h1');

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
            $("#trackArt").attr("src", recentTrack.image[3]["#text"]);
            $("#trackTitle").html(recentTrack.name);
            $("#trackArtist").html(recentTrack.artist["#text"]);
        },
        error : function(code, message) {
        }
    })
}
  
getSetLastFMData();
setInterval(getSetLastFMData, 10 * 1000);
