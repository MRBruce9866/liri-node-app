require("dotenv").config();

var keys = require("./keys.js");
var Spotify = require("node-spotify-api");
var spotify = new Spotify(keys.spotify);
var omdbKey = keys.omdb;
var axios = require("axios");
var moment = require("moment");


var command = process.argv[2];
var parameter = process.argv.slice(3).join(" ");
var output = {};

switch (command) {
    case "concert-this":
        getConcertInfo(parameter);
        break;
    case "spotify-this-song":
        getSpotifyInfo(parameter);
        break;
    case "movie-this":
        getMovieInfo(parameter);
        break;
    case "do-what-it-says":

        break;

    default:

        break;
}



function getConcertInfo(query) {
    var queryUrl = "https://rest.bandsintown.com/artists/" + query + "/events?app_id=codingbootcamp"


    axios.get(queryUrl).then(function (response) {
// console.log(response.data[0])
       response.data.forEach(event => {
           
        output["Venue"] = event.venue.name;
        output["Location"] = event.venue.city + " " + event.venue.region + ", " + event.venue.country;
        output["Date"] = moment(event.datetime).format("MM/DD/YYYY");

        displayObject(output);

       });

        


    }).catch(function (err) {
        console.log(err)

    })
}

function getSpotifyInfo(query) {


    if (query) {
        spotify.search({
            type: 'track',
            query: query
        }).then(function (response) {



            if (response.tracks.items.length > 0) {

                output["Song"] = response.tracks.items[0].name;
                output["Artist"] = response.tracks.items[0].artists[0].name;
                output["Album"] = response.tracks.items[0].album.name;
                output["Preview Url"] = response.tracks.items[0].preview_url;

            } else {
                output.Error = "Couldn't find a match for your request!"
            }

            displayObject(output);


        }).catch(function (err) {
            console.log(err);
        })
    } else {

        output.Error = "You must enter a song to search!";
        displayObject(output);

    }

}

function getMovieInfo(query) {
    var queryUrl = "https://www.omdbapi.com/?apikey=" + omdbKey + "&t=" + query;


    axios.get(queryUrl).then(function (response) {

        if (response.data.Response === "True") {
            if (response.data.Title)
                output["Title"] = response.data.Title;
            if (response.data.Year)
                output["Year"] = response.data.Year;
            if (response.data.Ratings[0])
                output["IMDB Rating"] = response.data.Ratings[0].Value;
            if (response.data.Ratings[1])
                output["Rotten Tomatoes Rating"] = response.data.Ratings[1].Value;
            if (response.data.Country)
                output["Country"] = response.data.Country;
            if (response.data.Language)
                output["Language"] = response.data.Language;
            if (response.data.Actors)
                output["Actors"] = response.data.Actors;
            if (response.data.Plot)
                output["Plot"] = response.data.Plot;
        } else {
            output["Error"] = "Couldn't find a match for your request!"
        }


        displayObject(output);


    }).catch(function (err) {
        console.log(err)

    })



}

function useDefaultSearch(userInput, query) {

}



function getLineBreak(num) {
    var line = "";

    for (let i = 0; i < num; i++) {
        line += "=";
    }
    return line;
}

function formatString(len, string = "") {
    if (string === null) string = "null";

    var output = "|";
    var middle = Math.floor(len / 2) - Math.floor(string.length / 2) + 1;
    while (output.length <= len) {
        if (output.length === middle && string.length > 0) {
            output += string;
        } else {
            output += " ";
        }
    }

    output += "|";
    return output;
}

function displayObject(obj) {
    var lineBreak = "";
    var maxLength = 20;

    for (const key in obj) {
        if (key.length + 2 > maxLength) maxLength = key.length + 2;
        if (obj[key] === null) {
            if (maxLength < 4) maxLength = 4;
        } else if (obj[key].length > maxLength) {
            maxLength = obj[key].length;
        }
    }

    maxLength += 2;
    lineBreak = getLineBreak(maxLength);

    console.log();
    console.log(formatString(maxLength, lineBreak));
    console.log(formatString(maxLength));
    for (const key in obj) {
        console.log(formatString(maxLength, "[" + key + "]"));
        console.log(formatString(maxLength, obj[key]));
        console.log(formatString(maxLength));
    }
    console.log(formatString(maxLength, lineBreak));
}

