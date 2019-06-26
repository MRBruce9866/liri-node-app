require("dotenv").config();

var keys = require("./keys.js");
var Spotify = require("node-spotify-api");
var spotify = new Spotify(keys.spotify);
var omdbKey = keys.omdb;
var axios = require("axios");
var moment = require("moment");
var fs = require("fs");

var inputCommand = process.argv[2];
var inputParameter = process.argv.slice(3).join(" ");
var output = {};


var commands = [{
        name: "spotify-this-song",
        desc: "Search Spotify for information about a song.",
        util: function (query) {
            if (query) {
                spotify.search({
                    type: 'track',
                    query: query
                }).then(function (response) {


                    if (response.tracks.items.length > 0) {

                        output["Song"] = response.tracks.items[0].name;


                        output["Artists"] = response.tracks.items[0].artists.map(function (artist) {
                            return artist.name;
                        }).join(" | ");
                        output["Album"] = response.tracks.items[0].album.name;
                        output["Preview Url"] = response.tracks.items[0].preview_url;
                        displayOutput(output, "SPOTIFY INFORMATION");

                    } else {
                        output.Error = `Couldn't find a match for ${query}!`
                        displayOutput(output, "ERROR");
                    }


                }).catch(function (err) {
                    console.log(err);
                })
            } else {

                output.Error = "You must enter a song to search";
                displayOutput(output, "ERROR");

            }
        }
    },
    {
        name: "concert-this",
        desc: "Search the Bands in Town API for upcoming concert dates for an artist or band.",
        util: function (query) {

            query = query.replace(/["]+/g, '');

            if (query) {
                var queryUrl = `https://rest.bandsintown.com/artists/${query}/events?app_id=codingbootcamp`


                axios.get(queryUrl).then(function (response) {


                    if (response.data.length > 0) {
                        response.data.forEach(event => {

                            output["Venue"] = event.venue.name;
                            output["Location"] = `${event.venue.city} ${event.venue.region}, ${event.venue.country}`;
                            output["Date"] = moment(event.datetime).format("MM/DD/YYYY");
                            displayOutput(output, "CONCERT INFORMATION")
                        });
                    } else {
                        output["No Events"] = `We couldn't find any upcoming events for ${query}`;
                        displayOutput(output, "ERROR")

                    }

                    ;

                }).catch(function (err) {
                    console.log(err)

                })

            } else {
                output.Error = "You must enter an artist or band to search";
                displayOutput(output, "ERROR");
            }
        }

    },
    {
        name: "movie-this",
        desc: "Search the OMDB API for information about a movie",
        util: function (query) {
            if (query) {
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
                        displayOutput(output, "MOVIE INFORMATION");
                    } else {
                        output["Error"] = `Couldn't find a match for ${query}!`
                        displayOutput(output, "ERROR");
                    }

                }).catch(function (err) {
                    console.log(err)

                })
            } else {

                output.Error = "You must enter a movie title to search";
                displayOutput(output, "ERROR");

            }
        }
    },
    {
        name: "do-what-it-says",
        desc: "Run a random command to get random information :)",
        util: function (query) {
            fs.readFile("random.txt", "utf8", function (error, data) {
                if (error) {
                    return console.log(error);
                }
                var rows = data.split("\r\n");

                var commandIndex = Math.floor(Math.random() * rows.length);
                var parameterIndex = Math.floor(Math.random() * rows[commandIndex].split(",").slice(1).length);
                var command = (rows[commandIndex].split(",")[0]).toString();
                var parameter = (rows[commandIndex].split(",").slice(1)[parameterIndex]).toString();

                console.log(commandIndex)
                console.log(parameterIndex)

                console.log(command)
                console.log(parameter)



                performCommand(command, parameter);

            });

        }
    },
]

performCommand(inputCommand, inputParameter);


// console.log(`Rows: ${process.stdout.rows}, Cols: ${process.stdout.columns}`)

// for (let y = 0; y < process.stdout.rows; y++) {
//     var temp = ""
//     for (let i = 0; i < process.stdout.columns; i++) {
//         temp += "X"

//     }
//     console.log(temp)
// }



function performCommand(input, parameter) {

    var command = commands.find(element => {
        if (element.name === input) {
            return element;
        }

    });
    if (command) {
        command.util(parameter);
    } else {
        output = {
            Error: "Not a valid command",
            Use: "node liri.js <command>",
            Commands: "spotify-this-song <song title> | concert-this <artist name> | movie-this <movie-title> | do-what-it-says"

        }
        displayOutput(output, "ERROR");
    }

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



function displayOutput(obj, title = "TITLE") {
    var lineBreak = "";
    var maxLength = 0;

    if (title.length > maxLength) maxLength = title.length;

    for (const key in obj) {

        if (obj[key] === null) {
            obj[key] = "null"
        }

        if (key.length + 2 > maxLength) maxLength = key.length + 2;
        if (obj[key].length > maxLength) {
            if(obj[key].length > process.stdout.columns-20){
                obj[key] = getStringArray(obj[key], (maxLength > 100) ? maxLength : 100);
                maxLength = (maxLength > 100) ? maxLength : 120;
            }else{
                maxLength = obj[key].length;
            }
            
        }
    }

    // console.log(maxLength)




    lineBreak = getLineBreak(maxLength);

    console.log();
    console.log(formatString(maxLength, lineBreak));
    console.log(formatString(maxLength));
    console.log(formatString(maxLength, title));
    console.log(formatString(maxLength));
    console.log(formatString(maxLength, lineBreak));
    console.log(formatString(maxLength));
    for (const key in obj) {
        console.log(formatString(maxLength, `[${key}]`));

        if(Array.isArray(obj[key])){
            obj[key].forEach(line => {
                console.log(formatString(maxLength, line));
            });
        }else{
            console.log(formatString(maxLength, obj[key]));
        }
        
        console.log(formatString(maxLength));
    }
    console.log(formatString(maxLength, lineBreak));

}

function getStringArray(text, len) {
    var output = [];
    wrapText(text, len)

    return output;

    function wrapText(text, len) {
        if (text.length > len) {
            for (let index = len - 1; index >= 0; index--) {

                if (text.charAt(index) === " ") {
                    output.push(text.slice(0, index));

                    text = text.slice(index + 1);
                    wrapText(text, len)
                    break;
                } else if (index === 0) {
                    output.push(text.slice(0, len));
                    text = text.slice(len);
                    wrapText(text, len)
                    break;
                }
            }

        } else {
            output.push(text);

            return output;
        }

    }



}