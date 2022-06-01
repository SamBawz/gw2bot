const Discord = require('discord.js');
const { Client, Intents, Message} = require('discord.js');
const { MessageEmbed } = require('discord.js');
//const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});
let talkedRecently = new Set();

let schedule = require("./schedule.json");
let config = require("./config.json");
const prefix = config.prefix;
//Required to fetch api data
const fetch = require('node-fetch');

let targetChannel = "";
client.once("ready", () => {
    console.log("bot up");
    //bottest channel
    client.channels.fetch('444237157029380096').then(targetChannel => channel = targetChannel);
    //Fractal channel
    //client.channels.fetch('750798181687885954').then(channel => targetChannel = channel);
    //checkDailies();
    //console.log("bot started on " + date.getHours() + " hours.");
    //setInterval(checkTime, 36000);
    client.user.setActivity("Type " + prefix + "fractals to start an event!", {type: "WATCHING"});
    postRaidSchedule(config.testChannel);
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
        let args = message.content.slice(prefix.length).trim().split(/ +/g);
        let command = args.shift().toLowerCase();
        switch (command) {
            case "fractals" :
                postFractalEvent(message.channel.id, message.author.username);
                //message.delete();
                break;
        }
    }
});

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
        postFractalEvent(config.testChannel);
        //console.log("new day! (day " + Math.ceil((Date.now() - hourOffset) / day) + ")");
        lastDailyCheck = Math.ceil((Date.now() - hourOffset) / day);
    }
    if (lastWeeklyCheck !== Math.ceil((Date.now() - hourOffset) / week)) {
        postRaidSchedule(config.testChannel);
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
    let wing1 = "";
    let wing2 = "";
    let wing3 = "";

    //Find the current week in the json file and get the relevant wing names
    schedule.weeks.forEach((week) => {
        if (week.id === schedule.currentWeek) {
            try {
                wing1 = week['wings'][0].name;
            } catch {}
            try {
                wing2 = ", " + week['wings'][1].name;
            } catch {}
            try {
                wing3 = "and " + week['wings'][2].name;
            } catch {}
        }
    });

    let raidEmbed = new MessageEmbed()
        .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
        .setTitle("Next week is week " + schedule.currentWeek + " of " + schedule.MaxWeeks + " (" + wing1 + wing2 + wing3 + ")")
        .setDescription(schedule.generalMessage)
        .addField('\u200b', 'And finally :no_entry_sign: if something urgent comes up and you will not be here!', false)
        .setTimestamp();

    client.channels.fetch(channel).then(targetChannel => targetChannel.send({ embeds: [raidEmbed] }));
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
                if(data.name.includes("Daily Tier 4")) {
                    dailyCount++;
                    returnMessage+= data.name.replace("Daily Tier 4", "");
                    if (dailyCount < 2) {
                        returnMessage+=",";
                    }
                    else if (dailyCount === 2) {
                        returnMessage+=" and";
                    }
                }
            })
        })
    })

    //Delay because fetching the data uses async functions
    setTimeout(() => {
        if (channel && channel.isText()) {
            if (creator == null) {
                let fractalEmbed = new MessageEmbed()
                    .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
                    .setTitle("Automated fractal event.")
                    .setDescription(returnMessage + ".")
                    .addField('\u200b', 'React with   :white_check_mark:   to join, or   :question:   if unsure.', false)
                    .setTimestamp();
                client.channels.fetch(channel).then(targetChannel => targetChannel.send({ embeds: [fractalEmbed] }).then(msg => {
                    msg.react('✅');
                    msg.react('❓');
                    //Delete after a day
                    setTimeout(() => msg.delete(), 86400000)
                }));
            }
            else {
                let fractalEmbed = new MessageEmbed()
                    .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
                    .setTitle(creator + " has created a fractal event!")
                    .setDescription(returnMessage + ".")
                    .addField('\u200b', 'React with   :white_check_mark:   to join, or   :question:   if unsure.', false)
                    .setTimestamp();
                client.channels.fetch(channel).then(targetChannel => targetChannel.send({ embeds: [fractalEmbed] }).then(msg => {
                    msg.react('✅');
                    msg.react('❓');
                    //Delete after a day
                    setTimeout(() => msg.delete(), 86400000)
                }));
            }




            //channel.send(returnMessage);
            //channel.send("React with  :white_check_mark:  to join, or  :question:  if unsure");


            console.log("posting dailies...");
        }
    }, 10000);
}

//Code to let the bot log in. This code has to be at the bottom
//Login with heroku (live)
//client.login(process.env.token);

//LOGIN LINES FOR TESTING
//Config contains the login token for the bot, the prefix and the owners id
//This file will not be present in Heroku (is in .gitignore), so comment for live purposes

client.login(config.token);


