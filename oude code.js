if(!exists) {
            channel.send("You're trying to create **" + name + "** with the following message: \n" + description + "\n **Please react with the emoji you would like to use for this wing to confirm**")
                .then(message => {
                    message.awaitReactions({max: 1, time: 60000, errors: ['time']})
                        .then(collected => {
                            const reaction = collected.first();

                            /*
                            let obj = {
                                table: []
                            };
                            obj.table.push({name: `${name}`, description:`${description}`, emoji:`${reaction.emoji.name}`});

                             */


                            /*
                            schedule["wings"] = {
                                name: name,
                                description: description,
                                emoji: reaction.emoji.name
                            };

                             */


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
        }
        else {
            channel.send("The wing you're trying to add already exists.");
        }


                                fs.readFile("./wings.json", 'utf8', function readFileCallback(err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    //Parse the data to a table
                                    let obj = JSON.parse(data);
                                    //Remove the element with the same name and replace it with the new one
                                    obj.splice(findWing(name), 1, {name: name, description: description, emoji: reaction.emoji.name})
                                    //Write it back to the json file
                                    fs.writeFile('./wings.json', JSON.stringify(obj), 'utf8', function readFileCallback(err, data) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            console.log("Edited the wing with name: " + name + " description: " + description + " emoji: " + reaction.emoji.name);
                                            message.delete();
                                            channel.send("Wing adjusted :)");
                                        }
                                    });
                                }
                            });








        /*
                                           fs.readFile("./weeks.json", 'utf8', function readFileCallback(err, data) {
                                               if (err) {
                                                   console.log(err);
                                               } else {
                                                   //Get all the wing names in order of the relevant reactions
                                                   let wingNames = [];
                                                   reaction.forEach(react => {
                                                       wings.forEach(wing => {
                                                           if (react.emoji.name === wing['emoji']) {
                                                               wingNames.push(wing['name']);
                                                           }
                                                       });
                                                   });
                                                   let obj = JSON.parse(data);
                                                   obj.splice(findWeek(number), 1, {
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
                                                   fs.writeFile('./weeks.json', JSON.stringify(obj), 'utf8', function readFileCallback(err, data) {
                                                       if (err) {
                                                           console.log(err);
                                                       }
                                                       else {
                                                           message.delete();
                                                           channel.send("Week adjusted :)");
                                                       }
                                                   });
                                               }
                                           });
                                           */











                                           /*
                                           let lastDailyCheck = Math.ceil((Date.now() - hourOffset) / day);
                                           let lastWeeklyCheck = Math.ceil((Date.now() - hourOffset) / week);
                                            */

                                           function checkTime() {
                                               //Daily check
                                               if (lastDailyCheck !== Math.ceil((Date.now() - hourOffset) / day)) {
                                                   //Fractal event
                                                   deletePreviousBotMessages(config['fractalChannel']);
                                                   postFractalEvent(config['fractalChannel']);
                                                   //console.log("new day! (day " + Math.ceil((Date.now() - hourOffset) / day) + ")");
                                                   lastDailyCheck = Math.ceil((Date.now() - hourOffset) / day);
                                               }
                                               //Weekly check
                                               if (lastWeeklyCheck !== Math.ceil((Date.now() - hourOffset) / week)) {
                                                   //Raid schedule
                                                   deletePreviousBotMessages(config['raidChannel']);
                                                   postRaidSchedule(config['raidChannel']);

                                                   //ASS reminder
                                                   deletePreviousBotMessages(config['reminderChannel']);
                                                   postAssReminder(config['reminderChannel']);

                                                   setCurrentWeek(schedule['currentWeek'] + 1);
                                                   lastWeeklyCheck = Math.ceil((Date.now() - hourOffset) / week);
                                               }
                                           }














                                           //This function keeps the variables and the relevant json files synchronized; An error when writing to a json file may desynch data
                                           function refreshJsonFiles() {
                                               try {
                                                   wings = JSON.parse(fs.readFileSync("./wings.json", "utf8"));
                                               } catch (err) {
                                                   console.log("error with wings.json: " + err);
                                               }

                                               try {
                                                   weeks = JSON.parse(fs.readFileSync("./weeks.json", "utf8"));
                                               } catch (err) {
                                                   console.log("error with weeks.json: " + err);
                                               }

                                               try {
                                                   schedule = JSON.parse(fs.readFileSync("./schedule.json", "utf8"));
                                               } catch (err) {
                                                   console.log("error with schedule.json: " + err);
                                               }

                                               try {
                                                   config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
                                                   //config = require("./config.json");
                                               } catch (err) {
                                                   console.log("error with config.json: " + err);
                                               }
                                           }