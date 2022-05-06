const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
//Config contains the login token for the bot, the prefix and the owners id
const config = require("./config.json");
//Required to fetch api data
const fetch = require('node-fetch');

let channel = "";
client.once("ready", () => {
    //bottest channel
    //client.channels.fetch('444237157029380096').then(targetChannel => channel = targetChannel);
    //Fractal channel
    client.channels.fetch('750798181687885954').then(targetChannel => channel = targetChannel);
    //checkDailies();
    setInterval(checkTime, 600000);
});

const date = new Date();
let checkCooldown = false;
function checkTime() {
    if (date.getHours() === 10 && !checkCooldown) {
        checkDailies();
        checkCooldown = true;
    }
    else if (date.getHours() > 10) {
        checkCooldown = false;
    }
}

function checkDailies() {
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
        console.log(returnMessage);
        if (channel && channel.isText()) {
            channel.send(returnMessage);
            channel.send("React with :accepted: to join, or :question: if unsure");
        }
    }, 10000);
}

//Code to let the bot log in. This code has to be at the bottom
//Login with heroku
client.login(process.env.token);

//Login for testing
client.login(config.token);