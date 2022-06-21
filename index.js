//#region SETUP AND INCLUDES OF THE BOT

const Discord = require('discord.js');
const {MessageEmbed} = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
//Required to fetch api data
const fetch = require('node-fetch');
//Required to use env files
require("dotenv").config();
let talkedRecently = new Set();

//Json files
const fs = require("fs");
let schedule = JSON.parse(fs.readFileSync("./json/schedule.json", "utf8"));
let wings = JSON.parse(fs.readFileSync("./json/wings.json", "utf8"));
let weeks = JSON.parse(fs.readFileSync("./json/weeks.json", "utf8"));
let config = JSON.parse(fs.readFileSync("./json/config.json", "utf8"));
const prefix = config['prefix'];

//endregion

//#region EVENTS

client.once("ready", () => {
    console.log("bot up");
    client.user.setActivity("Type " + prefix + "help for a list of commands!", {type: "PLAYING"});
});

client.on("presenceUpdate", () => {
    checkTime();
});

client.on("messageCreate", (message) => {
    //If the message starts with the prefix, the user has enough permissions to manage messages and the user isn't a bot, read the command
    if (message.content.startsWith(prefix) && message.member.permissions.toArray().includes("MANAGE_MESSAGES") && !message.author.bot) {
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
                    try {
                        message.author.send(fs.readFileSync("./help/help-1.txt", 'utf8'));
                        message.author.send(fs.readFileSync("./help/help-2.txt", 'utf8'));
                    } catch (err) {
                        console.log(err);
                    }
                    break;
                case "edit" :
                    switch (args[0].toLowerCase()) {
                        //Edits a selected wing. Argument is the name of the wing and the new description
                        case "wing" :
                            if (!args[1]) {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please enter the name of the wing.");
                                });
                            } else {
                                //The last parameter contains everything after the first three words
                                editWing(message.channel.id, args[1], message.content.split(' ').slice(3).join(' '));
                            }
                            break;
                        //Edit wings of the selected week. Argument is the number of the week
                        case "week" :
                            if (Number.isInteger(parseInt(args[1]))) {
                                editWeek(message.channel.id, args[1]);
                            } else {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please enter a number");
                                });
                            }
                            break;
                        //Edit the number of weeks in the schedule (this will wipe the weeks.json file, as well as setting the current week of the schedule to 1). Argument is the desired number of weeks
                        case "schedule" :
                            if (Number.isInteger(parseInt(args[1]))) {
                                newSchedule(message.channel.id, args[1]);
                            } else {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please enter a number");
                                });
                            }
                            break;
                        //Edit the general raid message that will always be added to the raid reminder
                        case "raidmessage" :
                            let raidmessage = message.content.split(' ').slice(2).join(' ');
                            schedule['generalMessage'] = raidmessage;
                            writeToJson("schedule", schedule, message.channel, "Something went wrong", "**Schedule message successfully changed to:**\n" + raidmessage)
                            break;
                    }
                    break;
                case "set" :
                    switch (args[0].toLowerCase()) {
                        //Adjust the current week in the schedule. Argument is the number of the week
                        case "week" :
                            if (Number.isInteger(parseInt(args[1]))) {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    let week = setCurrentWeek(parseInt(args[1]));
                                    writeToJson("schedule", schedule, targetChannel, "Something went wrong", "Current week in the schedule set to " + week);
                                });
                            } else {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please enter a number");
                                });
                            }
                            break;
                        //Sets the current channel as the fractal reminder channel in the config
                        case "fractalchannel" :
                            config['fractalChannel'] = message.channel.id;
                            writeToJson("config", config, message.channel, "Something went wrong", "Current channel is configured for receiving fractal events :)");
                            break;
                        //Sets the current channel as the ass reminder channel in the config
                        case "reminderchannel" :
                            config['reminderChannel'] = message.channel.id;
                            writeToJson("config", config, message.channel, "Something went wrong", "Current channel is configured for receiving thicc booty reminders :)");
                            break;
                        //Sets the current channel as the raid schedule channel in the config
                        case "raidchannel" :
                            config['raidChannel'] = message.channel.id;
                            writeToJson("config", config, message.channel, "Something went wrong", "Current channel is configured for receiving raid schedules :)");
                            break;
                    }
                    break;
                case "display" :
                    switch (args[0].toLowerCase()) {
                        //DM's the user all the wings in the json file
                        case "wings" :
                            showWings(message.author.id);
                            break;
                        //DM's the user the schedule (all weeks with selected wings)
                        case "schedule" :
                            showSchedule(message.author.id);
                            break;
                        //Displays the general raid message that is always added to the raid reminder
                        case "raidmessage" :
                            showRaidMessage(message.author.id);
                            break;
                        //Display the settings currently configured
                        case "config" :
                            showConfig(message.author.id);
                            break;
                    }
                    break;
                case "create" :
                    switch (args[0].toLowerCase()) {
                        //Adds a wing to the wings.json file. Arguments are; a name and a description
                        case "wing" :
                            if (!args[1]) {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please give a name to the new wing.");
                                });
                            } else {
                                addWing(message.channel.id, args[1], message.content.split(' ').slice(3).join(' '));
                            }
                            break;
                        //Creates a user created fractal event for people to sign up to
                        case "fractals" :
                            postFractalEvent(config['fractalChannel'], message.author.username);
                            break;
                        case "ass" :
                            postAssReminder(config['reminderChannel']);
                            break;
                        case "schedule" :
                            postRaidSchedule(config['raidChannel']);
                            break;
                    }
                    break;
                case "delete" :
                    switch (args[0].toLowerCase()) {
                        //Deletes a wing from the wings.json file. Argument is a name
                        case "wing" :
                            if (!args[1]) {
                                client.channels.fetch(message.channel.id).then(targetChannel => {
                                    targetChannel.send("Please enter the name of the wing you're trying to delete.");
                                });
                            } else {
                                deleteWing(message.channel.id, args[1]);
                            }
                            break;
                    }
                    break;
                case "toggle" :
                    switch (args[0].toLowerCase()) {
                        //Turns the weekly automated raid schedule reminder on or off
                        case "raids" :
                            config['postRaidSchedule'] = !config['postRaidSchedule'];
                            writeToJson("config", config, message.channel, "Something went wrong", "Raid schedule messages are set to: " + config['postRaidSchedule']);
                            break;
                        //Turns the daily automated fractal events on or off
                        case "fractals" :
                            config['postFractalEvents'] = !config['postFractalEvents'];
                            writeToJson("config", config, message.channel, "Something went wrong", "Raid schedule messages are set to: " + config['postFractalEvents']);
                            break;
                        //Turns the weekly automated ass reminder on or off
                        case "ass" :
                            config['postAssReminders'] = !config['postAssReminders'];
                            writeToJson("config", config, message.channel, "Something went wrong", "Raid schedule messages are set to: " + config['postAssReminders']);
                            break;
                    }
                    break;
            }
        }
    }
});

//#endregion

//#region MESSAGE FILTERS

//Ensures that the creator of the application can only respond
const confirmFilter = (reaction, user) => {
    return reaction.emoji.name === '👍' && user.id === message.author.id;
};

const userFilter = (user) => {
    return user.id === message.author.id;
};

//Everyone can respond
/*
const confirmFilter = (reaction) => {
    return reaction.emoji.name === '👍';
};

const userFilter = () => {
    return true;
};
 */

//#endregion

//#region GENERAL FUNCTIONS

function showConfig(author) {
    client.users.fetch(author).then(targetAuthor => {
        author = targetAuthor;
        let message = "These settings are currently saved:\nFractal event messages: **" + config['postFractalEvents'] + "**\nRaid schedule messages: **" + config['postRaidSchedule'] + "**\nASS reminder messages: **" + config['postAssReminders'] + "**";
        author.send(message);
    });
}

function deletePreviousBotMessages(channel) {
    client.channels.fetch(channel).then(targetChannel => {
        targetChannel.messages.fetch()
            .then(messages => {
                const botMessages = messages.filter(msg => msg.author.id === config['botId'] && msg.author.bot);
                targetChannel.bulkDelete(botMessages);
            });
    });
}

function writeToJson(fileName, object, channelToWriteTo = undefined, errorMessage = "", successMessage = "", messageToDelete = undefined) {
    fs.writeFile('./json/' + fileName + '.json', JSON.stringify(object), 'utf8', function readFileCallback(err, data) {
        if (typeof (channelToWriteTo) != "undefined") {
            if (err && errorMessage.length > 0) {
                try {
                    channelToWriteTo.send(errorMessage);
                } catch (err) {
                    console.log(err)
                }
            } else if (successMessage.length > 0) {
                try {
                    channelToWriteTo.send(successMessage);
                } catch (err) {
                    console.log(err)
                }
            }
            if (typeof (messageToDelete) != "undefined") {
                try {
                    messageToDelete.delete();
                } catch (err) {
                    console.log(err)
                }
            }
        }

        if (err) {
            console.log("couldn't write to json file: " + err);
            return false;
        } else {
            //Update the variable containing the json data
            try {
                object = JSON.parse(fs.readFileSync("./json/" + fileName + ".json", "utf8"));
            } catch (err) {
                console.log(err);
                channelToWriteTo.send("Database is desynchronized. Please contact Sam for help.");
                return false;
            }
        }
    });
    return true;
}

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
                            if (typeof (reaction) != "undefined") {
                                //Check if the emoji is already used
                                if (!getWingEmojis().includes(reaction.emoji.name)) {
                                    //Add the new wing to the wings table that we got from the json file
                                    wings.push({name: name, description: description, emoji: reaction.emoji.name});
                                    //Write the table back to the json file
                                    writeToJson("wings", wings, channel, "Something went wrong", "Wing added :)", message);
                                } else {
                                    message.delete();
                                    channel.send("The emoji you're trying to assign, is already in use by a different wing");
                                }
                            }
                        })
                        .catch(er => {
                            message.delete();
                            console.log(er);
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
                            if (typeof (reaction) != "undefined") {
                                if (!getWingEmojis().includes(reaction.emoji.name)) {
                                    //Adjust the wings table that we got from the json file by replacing an old object with the new data
                                    wings.splice(findWing(name), 1, {
                                        name: name,
                                        description: description,
                                        emoji: reaction.emoji.name
                                    });
                                    //Write it back to the json file
                                    writeToJson("wings", wings, channel, "Something went wrong", "Wing adjusted :)", message)
                                } else {
                                    message.delete();
                                    channel.send("The emoji you're trying to assign, is already in use by a different wing");
                                }
                            }
                        })
                        .catch(er => {
                            message.delete();
                            console.log(er);
                        });
                });
        } else {
            channel.send("The wing you're trying to edit doesn't exists");
        }
    });
}

//Displays all the wings in the JSON file
function showWings(author) {
    client.users.fetch(author).then(targetAuthor => {
        author = targetAuthor;
        let message = "These wings are currently saved:\n";
        wings.forEach(wing => {
            message += "---\n**" + wing['name'] + "**\n";
            if (wing['description'].length > 0) {
                message += "**Description:**\n";
                message += wing['description'] + "\n";
            }
            if (wing['emoji'].length > 0) {
                message += "**Emoji:**\n";
                message += wing['emoji'] + " \n";
            }
        })
        author.send(message);
    });
}

//function to delete a specific wing
function deleteWing(channel, name) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;
        //If the wing exists, send a confirmation message and delete the wing after approval
        if (findWing(name) > -1) {
            channel.send("You're trying to delete **" + name + "**. This will reset the schedule and delete currently configured weeks\n **Please react with 👍 to confirm**")
                .then(message => {
                    message.awaitReactions({confirmFilter, max: 1, time: 60000, errors: ['time']})
                        .then(collected => {
                            if (typeof (collected.first()) != "undefined") {
                                //Wipe the schedule
                                if (writeToJson("weeks", createSchedule(schedule['MaxWeeks']), channel, "Something went wrong")) {
                                    //Remove the wing from the file
                                    wings.splice(findWing(name), 1);
                                    writeToJson("wings", wings, channel, "Something went wrong", "Wing deleted and schedule reset :)", message);
                                }
                            }
                        })
                        .catch(er => {
                            message.delete();
                            console.log(er);
                        });
                });
        } else {
            channel.send("The wing you're trying to delete doesn't exists");
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

//Function to put all configured wing emojis in an array
function getWingEmojis() {
    let emojis = [];
    wings.forEach(wing => {
        if (wing['emoji'].length > 0) {
            emojis.push(wing['emoji']);
        }
    });
    return emojis;
}

//#endregion

//#region FUNCTIONS RELATING TO THE SCHEDULE

//Posts the final raid message of the current week to the given channel
function postRaidSchedule(channel) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;
        //Find the current week in the json file and get the relevant wing names and descriptions
        let wingNames = "";
        let wingDescriptions = "";
        let wing1 = getCurrentWeek()['wings'][0];
        if (typeof (wing1) != "undefined" && wing1.name.length > 0) {
            wingNames += wing1.name;
            wingDescriptions += wing1.name + "\n" + getWingByName(wing1.name)['description'];
        }
        let wing2 = getCurrentWeek()['wings'][1];
        if (typeof (wing2) != "undefined" && wing2.name.length > 0) {
            wingNames += ", " + wing2.name;
            wingDescriptions += "\n\n" + wing2.name + "\n" + getWingByName(wing2.name)['description'];
        }
        let wing3 = getCurrentWeek()['wings'][2];
        if (typeof (wing3) != "undefined" && wing3.name.length > 0) {
            wingNames += " and " + wing3.name;
            wingDescriptions += "\n\n" + wing3.name + "\n" + getWingByName(wing3.name)['description'];
        }
        let raidEmbed = new MessageEmbed()
            .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
            .setTitle("Next week is week " + schedule['currentWeek'] + " of " + schedule['MaxWeeks'] + " (" + wingNames + ")")
            .setDescription(schedule['generalMessage'] + "\n\n" + wingDescriptions)
            .addField('\u200b', 'And finally :no_entry_sign: if something urgent comes up and you will not be here!', false)
            .setTimestamp();
        channel.send({embeds: [raidEmbed]});
        /*
        .then(message => {
            message.awaitReactions({max: 1})
                .then(collected => {
                    const reaction = collected.first();
                    console.log("collected: " + reaction.emoji.name)
                    if (reaction.emoji.name === '🚫') {
                        console.log("Someone is absent!");
                    }
                })
        });

         */
    });
}

//Clears the current schedule and creates a new one based on the given size
function newSchedule(channel, size) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;
        if (size <= 0 || size > 50) {
            channel.send("The number cannot be 0, less than 0 or higher than 50");
        } else {
            channel.send("You are currently trying to set the number of weeks in the schedule to " + size + "\n**Please note that this will completely reset the schedule and clear currently configured weeks**\n**Respond with 👍 to confirm**")
                .then(message => {
                    message.awaitReactions({confirmFilter, max: 1, time: 60000, errors: ['time']})
                        .then(collected => {
                            if (typeof (collected.first()) != "undefined") {
                                if (writeToJson("weeks", createSchedule(size), channel, "Something went wrong")) {
                                    //Adjust the schedule file if writing to the json file was successful
                                    schedule['MaxWeeks'] = parseInt(size);
                                    setCurrentWeek(1);
                                    writeToJson("schedule", schedule, channel, "Something went wrong", "Schedule cleared and adjusted :)", message);
                                }
                            }
                        })
                        .catch(er => {
                            console.log(er);
                            message.delete();
                        });
                });
        }
    });
}

//Creates the array that will get pushed to the weeks.json file
function createSchedule(size) {
    //Create a new schedule
    let obj = [];
    for (let i = 0; i < size; i++) {
        obj.push({
            weekNumber: i + 1,
            wings: [{wingNumber: 1, name: ""}, {wingNumber: 2, name: ""}, {
                wingNumber: 3,
                name: ""
            }]
        });
    }
    return obj;
}

//Displays the weeks as they are written in the JSON file
function showSchedule(author) {
    client.users.fetch(author).then(targetAuthor => {
        author = targetAuthor;
        let message = "These weeks are currently saved:\n";
        weeks.forEach(week => {
            message += "---\n**Week " + week['weekNumber'] + "**\n";
            week['wings'].forEach(wing => {
                if (wing['name'].length > 0) {
                    message += wing['name'] + "\n";
                }
            })
        });
        author.send(message);
    });
}

//Displays the current schedule message as it is written in the JSON file
function showRaidMessage(author) {
    client.users.fetch(author).then(targetAuthor => {
        author = targetAuthor;
        let message = "**This message is currently set to always appear in raid schedules:**\n";
        message += schedule['generalMessage'];
        author.send(message);
    });
}

function editWeek(channel, number) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;
        //Check if the week is in the schedule
        if (findWeek(number) > -1) {
            //Go through every wing in the json file and get the relevant emojis
            let message = "You are currently editing **week " + number + "**\nPlease select three wings for the schedule this week out of the following list:\n";
            getWingEmojis().forEach(emoji => {
                message += emoji + " ";
            });
            channel.send(message)
                .then(message => {
                    message.awaitReactions({userFilter, max: 3, time: 60000, errors: ['time']})
                        .then(collected => {
                            //Convert the collected information to an array of three objects
                            const reaction = Array.from(collected.values());
                            if (typeof (reaction) != "undefined") {
                                //Check if the three reactions have emojis that are present in the wings.json file
                                if (typeof (reaction[0]) != "undefined" && typeof (reaction[1]) != "undefined" && typeof (reaction[2]) != "undefined") {
                                    if (getWingEmojis().includes(reaction[0].emoji.name) && getWingEmojis().includes(reaction[1].emoji.name) && getWingEmojis().includes(reaction[2].emoji.name)) {
                                        //Get all the wing names in order of the relevant reactions
                                        let wingNames = [];
                                        reaction.forEach(react => {
                                            wings.forEach(wing => {
                                                if (react.emoji.name === wing['emoji']) {
                                                    wingNames.push(wing['name']);
                                                }
                                            });
                                        });
                                        //Replace the chosen week in the weeks variable with a new object, containing the wings that were selected
                                        weeks.splice(findWeek(number), 1, {
                                            weekNumber: parseInt(number),
                                            "wings": [
                                                {
                                                    "wingNumber": 1,
                                                    "name": wingNames[0]
                                                },
                                                {
                                                    "wingNumber": 2,
                                                    "name": wingNames[1]
                                                },
                                                {
                                                    "wingNumber": 3,
                                                    "name": wingNames[2]
                                                }
                                            ]
                                        });
                                        //Write the weeks variable back to the json file
                                        writeToJson("weeks", weeks, channel, "Something went wrong", "Week adjusted :)", message);
                                    } else {
                                        message.delete();
                                        channel.send("Wings not found. Did you enter the right reactions?");
                                    }
                                } else {
                                    message.delete();
                                    channel.send("Wings not found. Did you enter the right reactions?");
                                }
                            }
                        })
                        .catch(er => {
                            message.delete();
                            console.log(er);
                        });
                });
        } else {
            channel.send("Week not found");
        }
    });
}

function getCurrentWeek() {
    let currentWeek;
    weeks.forEach((week) => {
        if (week['weekNumber'] === schedule['currentWeek']) {
            currentWeek = week;
        }
    });
    return currentWeek;
}

function getWingByName(name) {
    let selectedWing;
    wings.forEach((wing) => {
        if (wing['name'] === name) {
            selectedWing = wing;
        }
    });
    return selectedWing;
}

function setCurrentWeek(number) {
    if (number > schedule['MaxWeeks']) {
        number = 1;
    }
    schedule['currentWeek'] = number;
    return number;
}

function findWeek(number) {
    let weekId = -1;
    weeks.forEach((week, index) => {
        if (week['weekNumber'] === parseInt(number)) {
            weekId = index;
        }
    });
    return weekId;
}

//#endregion

//#region FUNCTIONS RELATING TO TIMED EVENTS

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;
//8 hours offset to account for the time at which reset happens in game
const hourOffset = hour * 8;
//Date offset of 3 days because date.now calculates the time since jan 1st 1970 WHICH IS A THURSDAY
//We want to check every sunday instead
const dayOffset = day * 3;
let timeCheckCooldown = false;

function checkTime() {
    //console.log((Date.now() - hourOffset + dayOffset) / week);
    //console.log(Math.ceil((Date.now() - hourOffset + dayOffset) / week))
    //Sets a cooldown of 60s on checking the time. This way the json files cant be read or written to multiple times per 60 seconds.
    if (!timeCheckCooldown) {
        timeCheckCooldown = true;
        setTimeout(() => {
            timeCheckCooldown = false;
        }, 60000);
        //Refresh the json variable to make sure that dates are synchronized
        fs.readFile('./json/schedule.json', function read(err, data) {
            if (err) {
                console.log("Problem with the schedule.json file: " + err);
            } else {
                schedule = JSON.parse(data);
                let changes = false;
                //Daily check
                if (parseInt(schedule['lastDailyCheck']) !== Math.ceil((Date.now() - hourOffset) / day)) {
                    //Fractal event
                    if (config['postFractalEvents']) {
                        deletePreviousBotMessages(config['fractalChannel']);
                        postFractalEvent(config['fractalChannel']);
                    }
                    //Update the schedule
                    console.log("It's a new day! Posting daily messages...");
                    schedule['lastDailyCheck'] = Math.ceil((Date.now() - hourOffset) / day);
                    changes = true;
                }
                //Weekly check
                if (parseInt(schedule['lastWeeklyCheck']) !== Math.ceil((Date.now() - hourOffset + dayOffset) / week)) {
                    //Raid schedule
                    if (config['postRaidSchedule']) {
                        deletePreviousBotMessages(config['raidChannel']);
                        postRaidSchedule(config['raidChannel']);
                    }
                    //ASS reminder
                    if (config['postAssReminders']) {
                        deletePreviousBotMessages(config['reminderChannel']);
                        postAssReminder(config['reminderChannel']);
                    }
                    //Update the schedule
                    console.log("It's a new week! Posting weekly messages...");
                    setCurrentWeek(schedule['currentWeek'] + 1);
                    schedule['lastWeeklyCheck'] = Math.ceil((Date.now() - hourOffset + dayOffset) / week);
                    changes = true;
                }
                //Write everything that has changed to the json file
                if (changes) {
                    writeToJson("schedule", schedule);
                }
            }
        });
    }
}

function postAssReminder(channel) {
    client.channels.fetch(channel).then(targetChannel => {
        channel = targetChannel;
        //Use fetch to find a random gif on tenor.com, based on the keyword
        let keywords = 'ass';
        //I got the api key from tenor at https://developers.google.com/tenor/guides/quickstart
        //https://medium.com/swlh/build-your-first-discord-gif-bot-and-deploy-2cc917888113
        let url = `https://api.tenor.com/v2/search?q=${keywords}&key=${process.env.TENOR_KEY}&contentfilter=low`;
        fetch(url).then((answer) => {
            return answer.json();
        }).then((body) => {
            //Body now contains an array of gifs based on the keyword. Get a random index to select a gif in this array
            const index = Math.floor(Math.random() * body.results.length);
            let assEmbed = new MessageEmbed()
                .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
                .setTitle("IT'S BOOTY TIME!")
                .setDescription("Get your Antique Summoning Stones now!")
                .setImage(body.results[index].media_formats.gif.url)
            channel.send({embeds: [assEmbed]});
        });
    });
}

function postFractalEvent(channel, creator) {
    let returnMessage = "Todays T4 fractal dailies are:"
    let dailyCount = 0;
    //Access the api to get the daily fractal achievements
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
            }
        }, 10000);
    });
}

//#endregion

//Code to let the bot log in. This code has to be at the bottom
//LOGIN LINES FOR TESTING
//Config contains the login token for the bot, the prefix and the owners id
//This file will not be present in Heroku (is in .gitignore), so comment for live purposes
client.login(process.env.token);