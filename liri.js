require("dotenv").config();

var keys = require("./keys.js");
var Spotify = require("node-spotify-api");
var spotify = new Spotify(keys.spotify);
var omdbKey = keys.omdb;
var axios = require("axios");
var moment = require("moment");
var fs = require("fs");


var command = process.argv[2];
var parameter = process.argv.slice(3).join(" ");
var output = {};

performCommand(command, parameter);

function performCommand(command, parameter) {

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
            readFileForSpotify();
            break;

        default:
            output = {
                Error: "Not a valid command",
                Use: "node liri.js <command>",
                Commands: "spotify-this-song <song title> | concert-this <artist name> | movie-this <movie-title> | do-what-it-says"

            }
            displayObject(output);
            break;
    }
}

function readFileForSpotify() {
    fs.readFile("random.txt", "utf8", function (error, data) {
        if (error) {
            return console.log(error);
        }

        var dataArray = data.split(",");
        console.log(dataArray);

        performCommand(dataArray[0], dataArray[1]);

    });
}



function getConcertInfo(query) {
    var queryUrl = `https://rest.bandsintown.com/artists/${query}/events?app_id=codingbootcamp`


    axios.get(queryUrl).then(function (response) {

        if (response.data.length > 0) {
            response.data.forEach(event => {

                output["Venue"] = event.venue.name;
                output["Location"] = `${event.venue.city} ${event.venue.region}, ${event.venue.country}`;
                output["Date"] = moment(event.datetime).format("MM/DD/YYYY");
                displayObject(output)
            });
        } else {
            output["Sorry"] = `We couldn't find any upcoming events for ${query}`;
            displayObject(output)

        }

        ;

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

                
                output["Artists"] = response.tracks.items[0].artists.map(function (artist){
                    return artist.name;
                }).join(" | ");
                output["Album"] = response.tracks.items[0].album.name;
                output["Preview Url"] = response.tracks.items[0].preview_url;

            } else {
                output.Error = `Couldn't find a match for ${query}!`
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
    var queryUrl = `https://www.omdbapi.com/?apikey=${omdbKey}&t=${query}`;


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
            output["Error"] = `Couldn't find a match for ${query}!`
        }


        displayObject(output);


    }).catch(function (err) {
        console.log(err)

    })



}





function getLineBreak(num) {
    var line = "";

    for (let i = 0; i < num; i++) {
        line += "-";
    }
    return line;
}

function formatString(len, string = "", sidebar = "|X|") {
    if (string === null) string = "null";

    var output = sidebar;
    var middle = Math.floor(len / 2) - Math.floor(string.length / 2) + sidebar.length;
    while (output.length < len + sidebar.length) {
        if (output.length === middle && string.length > 0) {
            output += string;
        } else {
            output += " ";
        }
    }

    output += sidebar;
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

    maxLength += 20;

    lineBreak = getLineBreak(maxLength);

    console.log();
    console.log(formatString(maxLength, lineBreak));
    console.log(formatString(maxLength));
    for (const key in obj) {
        console.log(formatString(maxLength, `[${key}]`));
        console.log(formatString(maxLength, obj[key]));
        console.log(formatString(maxLength));
    }
    console.log(formatString(maxLength, lineBreak));

}