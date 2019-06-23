require("dotenv").config();

var keys = require("./keys.js");
var Spotify = require("node-spotify-api");
var spotify = new Spotify(keys.spotify);


spotify.search({
    type: 'track',
    query: ''
}).then(function (response){

    response.tracks.items.forEach(item => {
        console.log(item.name);
        item.album.artists.forEach(e => {
            console.log(e.name);
        });
        console.log("-------------")
        console.log("")
    });

    


    
}).catch(function (err){
    console.log(err);
})