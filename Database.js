/**
 * Created by morcz on 21.01.2017.
 */
var mongoose = require("mongoose");


var Squad;
var Player;
var Matchday;

module.exports = (function () {
    var that = {},
        db = mongoose.connection,
        url,
        connected = false;

    function init(config) {
        url = "mongodb://" + config.host + ":" + config.port + "/" + config.database;

        // Model our Schema
        var matchday_details = mongoose.Schema({
            position: String,
            points: Number,
            all_points: Number,
            matchday_num: Number,
            value: String,
            squad: String,
            created_at: { type: Date, default: Date.now },
            updated_at: { type: Date, default: Date.now }
        });

        var playerSchema = mongoose.Schema({
            name: String,
            url: String,
            full_url: String,
            comunio_id: String,
            started_at: Number,
            last_points: Number,
            matchday_details: [matchday_details],
            created_at: { type: Date, default: Date.now },
            updated_at: { type: Date, default: Date.now }
        });

        var squadSchema = mongoose.Schema({
            name: String,
            url: String,
            full_url: String,
            image_url: String,
            season: String,
            last_points: Number,
            players: [playerSchema],
            created_at: { type: Date, default: Date.now },
            updated_at: { type: Date, default: Date.now }
        });
        squadSchema.set('collection', config.database);
        //Mongoose uses plural of model as collection, so collection name is "beers"
        Matchday = mongoose.model("Matchday", matchday_details);
        //Player = mongoose.model("Player", squadSchema);
        Squad = mongoose.model("Squad", squadSchema);
    }

    function connect() {
        return new Promise(function (resolve, reject) {
            mongoose.connect(url);
            db.on("error", function (err) {
                reject();
            });

            db.on("disconnect", function () {
                connected = false;
            });

            db.once("open", function () {
                connected = true;
                resolve();
            });
        });
    }

    function insertSquad(squadObj) {
        var squad = new Squad(squadObj);
        return new Promise(function (resolve, reject) {
            Squad.count({name: squadObj.name}, function (err, count) {
                if (count == 0) {
                    squad.save(function (err, squad) {
                        // console.log(squad);
                        if (err) {
                            console.log(err);
                            reject(err);

                        }
                        else {
                            resolve(squad);
                        }
                    });
                }
                else resolve([]);
            });
        });
    }


    function getAllSquads() {
        return new Promise(function (resolve, reject) {
            Squad.find({}, function (err, squads) {
                if (err) {
                    reject(err);
                } else {
                    resolve(squads);
                }
            });
        })
    }


    function getBeerByManufacturer(manufacturer) {
        return new Promise(function (resolve, reject) {
            Beer.find({manufacturer: manufacturer}, function (err, beer) {
                if (err) {
                    reject(err);
                } else {
                    resolve(beer);
                }
            });
        });
    }

    // also bei mir hat das auch alles ohne mongoose.Types.ObjectId(id) und nur mit id funktioniert. hab das aber trotzdem noch geändert
    function addTagToBeer(id, tag) {
        return new Promise(function (resolve, reject) {
            Beer.count({tags: {$in: [tag]}, _id: mongoose.Types.ObjectId(id)}, function (err, count) {
                if (count == 0) {
                    // {new: true} enables returning the updated document
                    Beer.findByIdAndUpdate(mongoose.Types.ObjectId(id), {$push: {tags: tag}}, {
                        safe: true,
                        upsert: true,
                        new: true
                    }, function (err, beer) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(beer);
                        }
                    })
                }
                else resolve([]);
            });
        });
    }

    function getSquadByName(name) {
        return new Promise(function (resolve, reject) {
            Squad.find({name: name}, function (err, squad) {
                if (err) {
                    reject(err);
                } else {
                    resolve(squad);
                }
            });
        });
    }

    function getSquadLastWeekPoints(squadName) {
        //  console.log(squadName)
        return new Promise(function (resolve, reject) {
            Squad.find({name: squadName}, {_id: 0, last_points: 1}, function (err, points) {
                resolve(points[0].last_points);
            });
        });
    }

    // mongoose.set('debug', true);
    function updateSquad(squad) {
        return new Promise(function (resolve, reject) {
            var i = 0;
            updateNewPlayer();
            function updateNewPlayer() {
                var updatePlayer = squad.players[i];
                var numOfPlayers = squad.players.length;
                (function (updatePlayer) { //start wrapper code
                    Squad.findOne({"players.comunio_id": updatePlayer.comunio_id}, {'players.$': 1}, function (err, player) {
                        var lastMatchdayDetailsNum =  player.players[0].matchday_details.length -1;
                        var lastMatchdayPoints = player.players[0].matchday_details[lastMatchdayDetailsNum].all_points;
                        var thisMatchdayPoints = parseInt(updatePlayer.matchday_details.all_points);

                        // --- test
                       /* var oldMatchdayNum = parseInt(player.players[0].matchday_details[lastMatchdayDetailsNum].matchday_num);
                     //   console.log(oldMatchdayNum);
                        var newMatchdayNum = oldMatchdayNum + 1;
                        var addPoints = Math.floor((Math.random() * 10) + 1);
                        thisMatchdayPoints += addPoints;

                        updatePlayer.matchday_details.all_points = thisMatchdayPoints;
                        updatePlayer.matchday_details.matchday_num = newMatchdayNum;*/
                        //---

                        var points = thisMatchdayPoints - lastMatchdayPoints;
                        updatePlayer.matchday_details.points = points;

                        Squad.findOneAndUpdate({"players.comunio_id": player.players[0].comunio_id}, {
                            $set: {
                                "players.$.last_points": points,
                                "players.$.updated_at": Date.now(),
                                updated_at: Date.now()
                            },
                            $push: {"players.$.matchday_details": new Matchday(updatePlayer.matchday_details)}
                        }, {
                            safe: true,
                            upsert: true,
                            new: true
                        }, function (err, updatedPlayer) {
                            //console.log(updatedPlayer.players[0].name)
                            if (err) {
                                console.log(err)
                            }
                            else {
                                if (i < numOfPlayers - 1) {
                                    i++;
                                    updateNewPlayer();
                                }
                                else {
                                    resolve(squad.name);
                                }
                            }
                        })
                    });
                })(updatePlayer);
            }
        });
    }


    function getPlayerByName(name) {
        return new Promise(function (resolve, reject) {
            Squad.findOne({"players.name": name}, {'players.$': 1}, function (err, player) {
                if (err) {
                    reject(err);
                } else {
                    resolve(player);
                }
            });
        });
    }

    function getLastPointsByPlayerName(name) {
        return new Promise(function (resolve, reject) {
            Squad.findOne({"players.name": name}, {'players.$': 1}, function (err, player) {
                if (err) {
                    reject(err);
                } else {
                    resolve(player.players[0].last_points);
                }
            });
        });
    }

    function getLastPointsByPlayerID(id) {
        return new Promise(function (resolve, reject) {
            Squad.findOne({"players._id": id}, {'players.$': 1}, function (err, player) {
                if (err) {
                    reject(err);
                } else {
                    resolve(player.players[0].last_points);
                }
            });
        });
    }

    function deleteBeer(id) {
        return new Promise(function (resolve, reject) {
            Beer.findByIdAndRemove(mongoose.Types.ObjectId(id), function (err, beer) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(beer);
                }
            })
        });
    }

    function isConnected() {
        return connected;
    }

    that.init = init;
    that.connect = connect;
    that.getAllSquads = getAllSquads;
    that.deleteBeer = deleteBeer;
    that.addTagToBeer = addTagToBeer;
    that.getBeerByManufacturer = getBeerByManufacturer;
    that.getSquadByName = getSquadByName;
    that.getPlayerByName = getPlayerByName;
    that.isConnected = isConnected;
    that.insertSquad = insertSquad;
    that.getSquadLastWeekPoints = getSquadLastWeekPoints;
    that.getLastPointsByPlayerName = getLastPointsByPlayerName;
    that.getLastPointsByPlayerID = getLastPointsByPlayerID;
    that.updateSquad = updateSquad;
    return that;
})();
