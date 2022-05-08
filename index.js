const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const { MessageEmbed } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
let talkedRecently = new Set();
const prefix = "!";
//Required to fetch api data
const fetch = require('node-fetch');

//let targetChannel = "";
client.once("ready", () => {
    //bottest channel
    //client.channels.fetch('444237157029380096').then(targetChannel => channel = targetChannel);
    //Fractal channel
    //client.channels.fetch('750798181687885954').then(channel => targetChannel = channel);
    //checkDailies();
    //console.log("bot started on " + date.getHours() + " hours.");
    //setInterval(checkTime, 36000);
});

client.on("message", (message) => {
    console.log(message);

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

    //If the message starts with the prefix
    if (message.content.startsWith(prefix)) {
        let args = message.content.slice(prefix.length).trim().split(/ +/g);
        let command = args.shift().toLowerCase();
        console.log(command);
        switch (command) {
            case "fractals" :
                checkDailies(message.channel);
                message.delete();
                break;
        }
    }
}); 

const date = new Date();
let checkCooldown = false;
function checkTime() {
    if (date.getHours() === 5 && !checkCooldown) {
        checkDailies();
        checkCooldown = true;
    }
    else if (date.getHours() > 5) {
        checkCooldown = false;
    }
}

function checkDailies(channel) {
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

            let fractalEmbed = new MessageEmbed()
                .setColor('#' + ("000000" + Math.random().toString(16).slice(2, 8).toUpperCase()).slice(-6))
                .setDescription(returnMessage)
                .setTimestamp()
                .setFooter({ text: "React with  :white_check_mark:  to join, or  :question:  if unsure" });

            channel.send(fractalEmbed);

            //channel.send(returnMessage);
            //channel.send("React with  :white_check_mark:  to join, or  :question:  if unsure");


            console.log("posting dailies...");
        }
    }, 10000);
}

//Code to let the bot log in. This code has to be at the bottom
//Login with heroku (live)
client.login(process.env.token);

//LOGIN LINES FOR TESTING
//Config contains the login token for the bot, the prefix and the owners id
//This file will not be present in Heroku (is in .gitignore), so comment for live purposes
/*
const config = require("./config.json");
client.login(config.token);
 */
