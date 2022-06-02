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