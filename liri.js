// Require dotenv to keep keys and personal data in a .env file to be hidden.
require("dotenv").config();

// initialize key variables and modules
var keys = require("./keys.js");
var Spotify = require("node-spotify-api");
var spotify = new Spotify(keys.spotify);
var omdbKey = keys.omdb;
var axios = require("axios");
var moment = require("moment");
var fs = require("fs");
var inquirer = require("inquirer");

// get user input via command-line arguments
var inputCommand = process.argv[2];
var inputParameter = process.argv.slice(3).join(" ");

//initialize output object to be displayed to the user.
var output = {};

/*  
    Created an array of objects holding valid commands for the user.
    I did this to try and learn more about objects and arrays. I use the desc.
    of each command to display to the user if they choose to use inquirer
    to select their command.
*/
var commands = [{
        //Name of the command. The command-line argument[2] must match this to call the util method.
        name: "spotify-this-song",
        //Short description of the command and what it does.
        desc: "Search Spotify for information about a song.",
        //This is used by the inquired to format a question.
        type: "song",
        //  This util function performs a search of the spotify api to gather information about a song
        util: function (query) {
            //Check if the query is empty. (User did not enter a parameter)
            if (query) {
                spotify.search({
                    type: 'track',
                    query: query
                }).then(function (response) {
                    //This is the promise returned from spotify

                    //Check if the response has the data we want.
                    if (response.tracks.items.length > 0) {

                        //Update the output object with song information
                        output["Song"] = response.tracks.items[0].name;
                        //The artists array holds objects for each artist. I use the .map function to pull
                        //only the artist's name. I then join the new array together into one string.
                        output["Artists"] = response.tracks.items[0].artists.map(function (artist) {
                            return artist.name;
                        }).join(" | ");
                        output["Album"] = response.tracks.items[0].album.name;
                        output["Preview Url"] = response.tracks.items[0].preview_url;
                        //Call display function with the output object and a title param.
                        displayOutput(output, "SPOTIFY INFORMATION");

                        log(`\nspotify-this-song ${query} [${moment().format("MM/DD/YYYY-hh:mmA")}]`);
                        log("------------------------------------------");
                        log(output);
                        log("------------------------------------------");


                    } else {
                        //If no data was found we update the output object with an error message and display it.
                        output.Error = `Couldn't find a match for ${query}!`
                        displayOutput(output, "ERROR");
                    }


                }).catch(function (err) {
                    //If an error is caught, console.log the error
                    console.log(err);
                })
            } else {
                //If no parameter was provided, update out with an error message and display it. 
                output.Error = "You must enter a song to search";
                displayOutput(output, "ERROR");

            }
        }
    },
    {
        //This command searches the Bands in Town api for any upcoming concert dates for an artist or band.
        name: "concert-this",
        desc: "Search the Bands in Town API for upcoming concert dates for an artist or band.",
        type: "artist/band",
        util: function (query) {
            //The api will give return an error object if the parameter has "". This removes double quotes from the string.
            //This regex format was found online and I need to understand how to use this better. 
            query = query.replace(/["]+/g, '');

            //Check if user entered a parameter to search
            if (query) {

                //Using the queryUrl to make an axios call
                var queryUrl = `https://rest.bandsintown.com/artists/${query}/events?app_id=codingbootcamp`
                axios.get(queryUrl).then(function (response) {
                    //The promised return from the axios call

                    //Check if the response has the data we want
                    if (response.data.length > 0) {

                        // The artist/band may have multiple upcoming concerts so we loop through and display them all.
                        response.data.forEach(event => {
                            //Update the output object with concert data.
                            output["Venue"] = event.venue.name;
                            output["Location"] = `${event.venue.city} ${event.venue.region}, ${event.venue.country}`;
                            //We use the moment.js lib to format the date of the event.
                            output["Date"] = moment(event.datetime).format("MM/DD/YYYY");
                            //Display the output object.
                            displayOutput(output, "CONCERT INFORMATION")

                            log(`\nconcert-this ${query} [${moment().format("MM/DD/YYYY-hh:mmA")}]`);
                            log("------------------------------------------");
                            log(output);
                            log("------------------------------------------");


                        });
                    } else {
                        //Error display if no events were found
                        output["No Events"] = `We couldn't find any upcoming events for ${query}`;
                        displayOutput(output, "ERROR")

                    }




                }).catch(function (err) {
                    // If the axios call fails and throws an error, console log it.
                    console.log(err)

                })

            } else {
                //If the user did not enter a search param. Display an error.
                output.Error = "You must enter an artist or band to search";
                displayOutput(output, "ERROR");
            }
        }

    },
    {
        //This command uses the OMDB Api to get information about a movie.
        name: "movie-this",
        desc: "Search the OMDB API for information about a movie",
        type: "movie",
        util: function (query) {
            //Check if the user entered a search param.
            if (query) {
                //Using an axios call to pull from the api.
                var queryUrl = `https://www.omdbapi.com/?apikey=${omdbKey}&t=${query}`;

                axios.get(queryUrl).then(function (response) {

                    //Check if response has the data we want.
                    if (response.data.Response === "True") {
                        //This is sloppy. Some of the data is not available for every search. This only displays the data that is available.
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
                        log(`\nmovie-this ${query} [${moment().format("MM/DD/YYYY-hh:mmA")}]`);
                        log("------------------------------------------");
                        log(output);
                        log("------------------------------------------");

                    } else {
                        //If there isn't a match for the search param, display and error.
                        output["Error"] = `Couldn't find a match for ${query}!`
                        displayOutput(output, "ERROR");
                    }

                }).catch(function (err) {
                    //If the axios call has an error, display it
                    console.log(err)

                })
            } else {
                //if the user didn't enter a movie title, display an error.
                output.Error = "You must enter a movie title to search";
                displayOutput(output, "ERROR");

            }
        }
    },
    {
        /*
            This method reads some predefined commands and parameters located in the random.txt to randomly call a command
            and display data. 
        */
        name: "do-what-it-says",
        desc: "Run a random command to get random information :)",
        util: function () {
            //Using the fileStream to read the random.txt file.
            fs.readFile("random.txt", "utf8", function (error, data) {
                //if an error happens, console.log it and return out of the fs.readFile method.
                if (error) {
                    return console.log(error);
                }

                //Splits the data returned into an array. Each element of the array holds one line of the file. \r\n  = new line and caridge return
                var rows = data.split("\r\n");
                //Get a random index for the command based on how many lines are in the file.
                var commandIndex = Math.floor(Math.random() * rows.length);
                //Get a random index for the param. based on how many params there are on the rows[commandIndex] line.
                var parameterIndex = Math.floor(Math.random() * rows[commandIndex].split(",").slice(1).length);
                //Get the command from the chosen line.
                var command = (rows[commandIndex].split(",")[0]);
                //Get the param. from the chosen line and chosen param. index.
                var parameter = (rows[commandIndex].split(",").slice(1)[parameterIndex]);

                //Calls the performCommand function with the random command and parameter.
                performCommand(command, parameter);

            });

        }
    },
]

//Calls the performCommand function with the command-line inputs from the user
performCommand(inputCommand, inputParameter);


function performCommand(input, parameter) {

    //Loops through the array of commands to find the first object with a matching name to the input.
    var command = commands.find(element => {
        if (element.name === input) {
            return element;
        }

    });
    //If a valid command is found, call the util method of that object, passing through the parameter.
    if (command) {
        command.util(parameter);
    } else {

        if (input) {
            //If the command was not found, display and error to the user.
            output = {
                Error: "Not a valid command",
                Use: "node liri.js <command>",
                Commands: "spotify-this-song <song title> | concert-this <artist name> | movie-this <movie-title> | do-what-it-says"

            }
            displayOutput(output, "ERROR");
        } else {
            getUserInput();
        }


    }

}
//Function to get user input via inquirer
function getUserInput() {
    //call the inquirer prompt method to get prompt the user for a command
    inquirer.prompt(
        [{
            //variable to store the answer from the user.
            name: "command",
            //message to display to the user.
            message: "Welcome to the liri app. Choose a command to run.",
            //We will use a list type to allow choices to be chosen from the commands array.
            type: 'list',
            //This pulls the desc. from each of the command objects in the array and allows the user to select the one they want.
            choices: commands.map(cmd => {
                return cmd.desc
            })

        }]).then(function (answer) {
        //This is the return promise of the prompt.

        //We search the commands array for an object with a matching desc. and set that to a variable to be used later.
        var command = commands.find(function (ele) {
            if (answer.command === ele.desc) {
                return ele;
            }
        });
        //This second prompt is used for getting the search parameter.
        inquirer.prompt(
            [{
                name: "parameter",
                //We use the type value of the selected command to display the correct context to the user.
                message: `What ${command.type} would you like information about?`,
                //We allow the user to type there input.
                type: 'input',


            }]).then(function (answer) {
            //When then call the util method of the selected command with the given parameter.
            command.util(answer.parameter);
        });


    });


}



//Helper function to create a 'line break' display.
function getLineBreak(num) {
    var line = "";
    //Create a string of characters with a length of num.
    for (let i = 0; i < num; i++) {
        //This charater will repeat based on the num value.
        line += "-";
    }
    //return the new string.
    return line;
}

//Helper function to center the text based on the len param. The sidebar is used to create a left and right border to display.
function formatString(len, string = "", sidebar = "|X|") {
    //If the string is literally null,
    //We want the string to hold the string representation of null to display to the user.
    if (string === null) string = "null";

    //We start the string with the left border.
    var output = sidebar;
    //This finds the center character index of the display based on the length.
    //To find where to place the string to center it, we subtract half the length of the string from the center index.
    var stringStart = Math.floor(len / 2) - Math.floor(string.length / 2) + sidebar.length;
    while (output.length < len + sidebar.length) {
        //This while loop adds spaces to the output until the output length matches the len passed in. Starting on the left side of the string.
        if (output.length === stringStart && string.length > 0) {
            //If the output length is at the stringStart index, we add the string onto the output.
            output += string;
            //The spaces will now be added to the right side of the string.
        } else {
            //We continue adding spaces until the output length matches the len passed in.

            output += " ";
        }
    }

    //add the right border to the output.
    output += sidebar;
    // return the output string.
    return output;
}


//This function display the output object to the console.
function displayOutput(obj, title = "TITLE") {

    //Initialize variables.
    var lineBreak = "";
    //Initialize the maxLength to the minimum size.
    var maxLength = 30;
    //We will update the maxLength based on the data to be display.
    //The maxLength will, for the most part, match the longest string in the output object.
    if (title.length > maxLength) maxLength = title.length;

    //We loop through the object to find the maxLength.
    for (const key in obj) {
        //If the value is null, We want it to be a string representation of the word null.
        if (obj[key] === null) {
            obj[key] = "null"
        }
        //Since were are adding [] around each of the keys in the object to display, we add two to their length.
        if (key.length + 2 > maxLength) maxLength = key.length + 2;
        //If the value.lenght is greater than the current maxLength, we update maxLength to match it.
        if (obj[key].length > maxLength) {
            /*
            This is sloppy!!!!!!!
            This is an attempt at making a word wrap type display.
            Since I created the output object with only strings, if the string is longer than the terminal window, the display gets distorted.
            To remedy that, we want any string that is longer than the terminal window to wrap.
            Because my formatString function  formats one string at a time, I break the string value up into an array of lines with
            my getStringArray function so that I can loop through the array later and display each line with the correct formatting.
            I used hard-coded numbers here to try and keep the display from getting too wide, However this still has issues when the terminal 
            screen is too narrow.
            */
            if (obj[key].length > process.stdout.columns - 20) {
                obj[key] = getStringArray(obj[key], (maxLength > 100) ? maxLength : 100);
                maxLength = (maxLength > 100) ? maxLength : 120;
            } else {
                maxLength = obj[key].length;
            }

        }
    }

    //Creating a 1 character padding around the longest string in the object.
    maxLength += 2;

    //We create a line break based on the maxLength.
    lineBreak = getLineBreak(maxLength);

    //We start displaying to the user with a 'title bar' type display.
    console.log();
    //This display a border at the top of the display.
    console.log(formatString(maxLength, lineBreak));
    console.log(formatString(maxLength));
    //This displays the title of the display with spacing above and below it.
    console.log(formatString(maxLength, title));
    console.log(formatString(maxLength));
    //This adds a bottom border to the title display.
    console.log(formatString(maxLength, lineBreak));
    console.log(formatString(maxLength));

    //We loop through the obj.
    for (const key in obj) {
        //This is were we display the key value in [] to the user;
        console.log(formatString(maxLength, `[${key}]`));

        //If the value is an array (word wrap), we loop through the array and display each line seperately. 
        if (Array.isArray(obj[key])) {
            obj[key].forEach(line => {
                console.log(formatString(maxLength, line));
            });
        } else {
            //If the value is not an array, we assume it's a string and display it in one line.
            console.log(formatString(maxLength, obj[key]));
        }
        //This adds spacing from the last value to the bottom border.
        console.log(formatString(maxLength));
    }
    //This addes a bottom border to the display window.
    console.log(formatString(maxLength, lineBreak));

}

//Helper function to break up a string into smaller parts to display. It returns an array of smaller strings. (Word Wrap)
//This is also very sloppy.
function getStringArray(text, len) {
    //intiliaze the output array.
    var output = [];
    //pass the params into the word wrap method.
    wrapText(text, len)

    return output;

    //I use an inner function here to be able to call the function recursively until every sub string is the required length.
    function wrapText(text, len) {
        //Check if the string is longer than the max length (len).
        if (text.length > len) {
            //We loop through a portion of the string to find a space to seperate at.
            //We start the index at the max length position and work backwards through the string.
            for (let index = len - 1; index >= 0; index--) {

                if (text.charAt(index) === " ") {
                    //If we find a space in the string, we slice the string from the beginning of the string to the current index (where the space is).
                    //We push that portion to the output array.
                    output.push(text.slice(0, index));
                    //We then set the text to the rest of the string without the space where we stopped at.
                    text = text.slice(index + 1);
                    //We do a recursive call on the rest of the string to break the string up further.
                    wrapText(text, len)
                    //IMPORTANT!!
                    //We then have to break out of the loop to keep it from continuing to look for the next space in the portion we already pushed to the array.
                    break;
                } else if (index === 0) {
                    //If we never find a space in the string, we seperate it anyway at whatever character is at the max length position.
                    output.push(text.slice(0, len));
                    //This time we keep the character we seperated at and do recursive call for the rest of the string.
                    text = text.slice(len);
                    wrapText(text, len)
                    break;
                }
            }

        } else {
            //If the length of the string is less than the max length (len), with push the string to the array and return the array.
            output.push(text);

            return output;
        }

    }

}

function log(output) {
    var text = "";

    if (typeof output === "object") {
        for (const key in output) {
            text += `\n[${key}]`
            text += `\n${output[key]}`;
        }

    } else if (Array.isArray(output)) {
        output.forEach(e => {
            text += `\n${e}`;
        });
    } else {
        text += `\n${output}`;
    }




    fs.appendFileSync("log.txt", text, function (err) {
        if (err) {
            console.log(err);
        }
    })
}