//#region SETUP AND INCLUDES OF THE BOT

const Discord = require('discord.js');
//const {Client, Intents, Message} = require('discord.js');
const {MessageEmbed} = require('discord.js');
//const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
let talkedRecently = new Set();

const fs = require("fs");
let schedule = JSON.parse(fs.readFileSync("./schedule.json", "utf8"));
let wings = JSON.parse(fs.readFileSync("./wings.json", "utf8"));
//let schedule = require("./schedule.json");

let config = require("./config.json");
const prefix = config.prefix;
//Required to fetch api data
const fetch = require('node-fetch');

let targetChannel = "";

//endregion

//#region EVENTS

client.once("ready", () => {
    console.log("bot up");
    //bottest channel
    client.channels.fetch('444237157029380096').then(targetChannel => channel = targetChannel);
    //Fractal channel
    //client.channels.fetch('750798181687885954').then(channel => targetChannel = channel);
    //checkDailies();
    //console.log("bot started on " + date.getHours() + " hours.");
    //setInterval(checkTime, 36000);
    client.user.setActivity("Type " + prefix + "help for a list of commands!", {type: "PLAYING"});
    //postRaidSchedule(config.testChannel);
});

client.on("presenceUpdate", () => {
    checkTime();
});

client.on("messageCreate", (message) => {
    //If the message starts with the prefix
    if (message.content.startsWith(prefix)) {
        //If the author is a bot then ignore
        if (message.author.bot) {
            return;
        }

        //If talkedRecently still exists (the bot has been summoned more then once in 1.5 seconds and by the same user) then return
        if (talkedRecently.has(message.author.id)) {
            return;
        }

        //Adds the user to the talkedRecently set
        talkedRecently.add(message.author.id);
        setTimeout(() => {
            //Removes the user from the talkedRecently set after 1 second
            talkedRecently.delete(message.author.id);
        }, 1000);

        //Command processing
        //Remove the prefix and split the words into an array
        let args = message.content.slice(prefix.length).trim().split(/ +/g);
        //Certain commands require a longer argument containing spaces
        //This variable contains everything after the first three words
        let extendedArg = message.content.split(' ').slice(3).join(' ');

        if (!args[0]) {
            client.channels.fetch(message.channel.id).then(targetChannel => {
                targetChannel.send("Your command is missing an argument.");
            });
        } else {
            //The command is the first word without prefix and set to lowercase
            let command = args.shift().toLowerCase();
            switch (command) {
                //DM's a list of all available commands
                case "help" :
                    break;
                case "edit" :
                    switch (args[0]) {
                        //Edits a selected wing. Argument is the name of the wing and the new description
                        case "wing" :
                            if (!args[1]) {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please enter the name of the wing.");
                                });
                            } else {
                                editWing(message.channel.id, args[1], extendedArg);
                                updateWingsFile();
                            }
                            break;
                        //Edit wings of the selected week. Argument is the number of the week
                        case "week" :

                            break;
                        //Edit the number of weeks in the schedule (this will wipe the weeks.json file). Argument is the desired number of weeks
                        case "schedule" :

                            break;
                        default :
                            break;
                    }
                    break;
                case "set" :
                    switch (args[0]) {
                        //Adjust the current week in the schedule. Argument is the number of the week
                        case "week" :

                            break;
                        //Sets the current channel as the fractal reminder channel in the config
                        case "fractalchannel" :

                            break;
                        //Sets the current channel as the ass reminder channel in the config
                        case "reminderchannel" :

                            break;
                        //Sets the current channel as the raid schedule channel in the config
                        case "raidchannel" :

                            break;
                        default :
                            break;
                    }
                    break;
                case "show" :
                    switch (args[0]) {
                        //DM's the user all the wings in the json file
                        case "wings" :
                            showWings(message.author.id);
                            break;
                        //DM's the user the schedule (all weeks with selected wings)
                        case "schedule" :
                            break;
                        default :
                            break;
                    }
                    break;
                case "create" :
                    switch (args[0]) {
                        //Adds a wing to the wings.json file. Arguments are; a name and a description
                        case "wing" :
                            if (!args[1]) {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please give a name to the new wing.");
                                });
                            } else {
                                addWing(message.channel.id, args[1], extendedArg);
                                updateWingsFile();
                            }
                            break;
                        //Creates a user created fractal event for people to sign up to
                        case "fractals" :
                            postFractalEvent(message.channel.id, message.author.username);
                            break;
                        default :
                            break;
                    }
                    break;
                case "delete" :
                    switch (args[0]) {
                        //Deletes a wing from the wings.json file. Argument is a name
                        case "wing" :
                            if (!args[1]) {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please enter the name of the wing you're trying to delete.");
                                });
                            } else {
                                deleteWing(message.channel.id, args[1]);
                                updateWingsFile();
                            }
                            break;
                    }
                    break;
                case "toggle" :
                    switch (args[0]) {
                        //Turns the weekly automated raid schedule reminder on or off
                        case "raids" :
                            break;
                        //Turns the daily automated fractal events on or off
                        case "fractals" :
                            break;
                        //Turns the weekly automated ass reminder on or off
                        case "ass" :
                            break;
                        default :
                            break;
                    }
                    break;
                default :
                    break;
            }
        }
    }
});

//#endregion

//#region MESSAGE FILTERS

//Ensures that the creater of the application can only respond
const confirmFilter = (reaction, user) => {
    return reaction.emoji.name === '👍' && user.id === message.author.id;
};

//#endregion

//#region FUNCTIONS RELATING TO WINGS

//Function to create new wings
function addWing(channel, name, description) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;

        //If the wing doesn't exist yet, send a confirmation message and create the wing after approval
        if (findWing(name) === -1) {
            channel.send("You're trying to create **" + name + "** with the following message: \n" + description + "\n **Please react with the emoji you would like to use for this wing to confirm**")
                .then(message => {
                    message.awaitReactions({max: 1, time: 60000, errors: ['time']})
                        .then(collected => {
                            const reaction = collected.first();
                            fs.readFile("./wings.json", 'utf8', function readFileCallback(err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    //Parse the data to a table
                                    let obj = JSON.parse(data);
                                    //Push new data on it
                                    obj.push({name: name, description: description, emoji: reaction.emoji.name});
                                    //Write it back to the json file
                                    fs.writeFile('./wings.json', JSON.stringify(obj), 'utf8', function readFileCallback(err, data) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                    console.log("Added a new wing with name: " + name + " description: " + description + " emoji: " + reaction.emoji.name);
                                }
                            });
                            message.delete();
                            channel.send("Wing added :)");

                        })
                        .catch(collected => {
                            message.delete();
                            console.log("message deleted after one minute of no response");
                        });
                });
        } else {
            channel.send("The wing you're trying to add already exists.");
        }
    });
}

//function to edit a specific wing
function editWing(channel, name, description) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;

        //If the wing exists, send a confirmation message and edit the wing after approval
        if (findWing(name) > -1) {
            channel.send("You're trying to edit **" + name + "** with the following message: \n" + description + "\n **Please react with the emoji you would like to use for this wing to confirm**")
                .then(message => {
                    message.awaitReactions({max: 1, time: 60000, errors: ['time']})
                        .then(collected => {
                            const reaction = collected.first();
                            fs.readFile("./wings.json", 'utf8', function readFileCallback(err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    //Parse the data to a table
                                    let obj = JSON.parse(data);
                                    //Remove the element with the same name
                                    obj.splice(findWing(name), 1)
                                    //Push new data on it
                                    obj.push({name: name, description: description, emoji: reaction.emoji.name});
                                    //Write it back to the json file
                                    fs.writeFile('./wings.json', JSON.stringify(obj), 'utf8', function readFileCallback(err, data) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                    console.log("Edited the wing with name: " + name + " description: " + description + " emoji: " + reaction.emoji.name);
                                }
                            });
                            message.delete();
                            channel.send("Wing adjusted :)");
                        })
                        .catch(collected => {
                            message.delete();
                            console.log("message deleted after one minute of no response");
                        });
                });
        } else {
            channel.send("The wing you're trying to edit doesn't exists.");
        }
    });
}

//Displays all the wings in the JSON file
function showWings(author) {
    client.users.fetch(author).then(targetAuthor => {
        author = targetAuthor;
        fs.readFile("./wings.json", 'utf8', function readFileCallback(err, data) {
            if (err) {
                console.log(err);
            } else {
                author.send(data.toString()).catch(err => {
                    console.log(err)
                });
            }
        });
    });
}

//function to delete a specific wing
function deleteWing(channel, name) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;

        //If the wing exists, send a confirmation message and delete the wing after approval
        if (findWing(name) > -1) {
            channel.send("You're trying to delete **" + name + "** \n **Please react with 👍 : to confirm**")
                .then(message => {
                    message.awaitReactions({confirmFilter, max: 1, time: 60000, errors: ['time']})
                        .then(collected => {
                            fs.readFile("./wings.json", 'utf8', function readFileCallback(err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    //Parse the data to a table
                                    let obj = JSON.parse(data);
                                    //Remove the element with the same name
                                    obj.splice(findWing(name), 1)
                                    //Write it back to the json file
                                    fs.writeFile('./wings.json', JSON.stringify(obj), 'utf8', function readFileCallback(err, data) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                    console.log("Deleted the wing with name: " + name);
                                }
                            });
                            message.delete();
                            channel.send("Wing deleted :)");
                        })
                        .catch(collected => {
                            message.delete();
                            console.log("message deleted after one minute of no response");
                        });
                });
        } else {
            channel.send("The wing you're trying to delete doesn't exists.");
        }
    });
}

//Try to find the name of the wing in the JSON file and returns the id of the relevant wing. Returns -1 if no wings are found
function findWing(name) {
    let wingId = -1;
    wings.forEach((wing, index) => {
        if (wing['name'] === name) {
            wingId = index;
        }
    });
    return wingId;
}

//Refreshes the JSON file in the cache. This will have to be done everytime the JSON file gets adjusted
function updateWingsFile() {
    try {
        wings = JSON.parse(fs.readFileSync("./wings.json", "utf8"));
    } catch (err) {
        console.log(err);
    }
}

//#endregion

//#region FUNCTIONS RELATING TO TIMED EVENTS

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;
//5 hours offset to account for the time at which reset happens in game
const hourOffset = hour * 5;
let lastDailyCheck = Math.ceil((Date.now() - hourOffset) / day);
let lastWeeklyCheck = Math.ceil((Date.now() - hourOffset) / week);

function checkTime() {
    if (lastDailyCheck !== Math.ceil((Date.now() - hourOffset) / day)) {
        postFractalEvent(config.fractalChannel);
        //console.log("new day! (day " + Math.ceil((Date.now() - hourOffset) / day) + ")");
        lastDailyCheck = Math.ceil((Date.now() - hourOffset) / day);
    }
    if (lastWeeklyCheck !== Math.ceil((Date.now() - hourOffset) / week)) {
        postRaidSchedule(config.raidChannel);
        incrementCurrentWeek();
        lastWeeklyCheck = Math.ceil((Date.now() - hourOffset) / week);
    }
}

function incrementCurrentWeek() {
    schedule.currentWeek++;
    if (schedule.currentWeek > schedule.MaxWeeks) {
        schedule.currentWeek = 1;
    }
}

function postRaidSchedule(channel) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;

        let wing1 = "";
        let wing2 = "";
        let wing3 = "";

        //Find the current week in the json file and get the relevant wing names
        schedule['weeks'].forEach((week) => {
            if (week.id === schedule.currentWeek) {
                try {
                    wing1 = week['wings'][0].name;
                } catch {
                }
                try {
                    wing2 = ", " + week['wings'][1].name;
                } catch {
                }
                try {
                    wing3 = " and " + week['wings'][2].name;
                } catch {
                }
            }
        });

        let raidEmbed = new MessageEmbed()
            .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
            .setTitle("Next week is week " + schedule['currentWeek'] + " of " + schedule['MaxWeeks'] + " (" + wing1 + wing2 + wing3 + ")")
            .setDescription(schedule['generalMessage'])
            .addField('\u200b', 'And finally :no_entry_sign: if something urgent comes up and you will not be here!', false)
            .setTimestamp();

        channel.send({embeds: [raidEmbed]})
            .then(message => {
                message.awaitReactions({max: 1})//, time: 60000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();
                        console.log("collected: " + reaction.emoji.name)
                        if (reaction.emoji.name === '🚫') {
                            console.log("Someone is absent!");
                        }
                    })
                /*
                .catch(collected => {
                    message.delete();
                    console.log("message deleted after one minute of no response");
                })
                 */
            });
    });
}

function postFractalEvent(channel, creator) {
    let returnMessage = "Todays T4 fractal dailies are:"
    let dailyCount = 0;

    fetch("https://api.guildwars2.com/v2/achievements/daily"
    ).then((answer) => {
        return answer.text();
    }).then((body) => {
        const data = JSON.parse(body);
        const fractalAchievements = data["fractals"];

        fractalAchievements.forEach((achievement) => {
            fetch("https://api.guildwars2.com/v2/achievements?id=" + achievement.id
            ).then((answer) => {
                return answer.text();
            }).then((body) => {
                const data = JSON.parse(body);
                if (data.name.includes("Daily Tier 4")) {
                    dailyCount++;
                    returnMessage += data.name.replace("Daily Tier 4", "");
                    if (dailyCount < 2) {
                        returnMessage += ",";
                    } else if (dailyCount === 2) {
                        returnMessage += " and";
                    }
                }
            })
        })
    })

    //Fetch the relevant channel before posting
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;

        //Delay because fetching the api data uses async functions
        setTimeout(() => {
            if (channel && channel.isText()) {
                if (creator == null) {
                    let fractalEmbed = new MessageEmbed()
                        .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
                        .setTitle("Automated fractal event.")
                        .setDescription(returnMessage + ".")
                        .addField('\u200b', 'React with   :white_check_mark:   to join, or   :question:   if unsure.', false)
                        .setTimestamp();
                    channel.send({embeds: [fractalEmbed]})
                        .then(msg => {
                            msg.react('✅');
                            msg.react('❓');
                            //Delete after a day
                            setTimeout(() => msg.delete(), 86400000)
                        });
                } else {
                    let fractalEmbed = new MessageEmbed()
                        .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
                        .setTitle(creator + " has created a fractal event!")
                        .setDescription(returnMessage + ".")
                        .addField('\u200b', 'React with   :white_check_mark:   to join, or   :question:   if unsure.', false)
                        .setTimestamp();
                    channel.send({embeds: [fractalEmbed]})
                        .then(msg => {
                            msg.react('✅');
                            msg.react('❓');
                            //Delete after a day
                            setTimeout(() => msg.delete(), 86400000)
                        });
                }


                //channel.send(returnMessage);
                //channel.send("React with  :white_check_mark:  to join, or  :question:  if unsure");


                console.log("posting dailies...");
            }
        }, 10000);
    });
}

//#endregion

//Code to let the bot log in. This code has to be at the bottom
//Login with heroku (live)
//client.login(process.env.token);

//LOGIN LINES FOR TESTING
//Config contains the login token for the bot, the prefix and the owners id
//This file will not be present in Heroku (is in .gitignore), so comment for live purposes

client.login(config.token);