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
        /*     var matchday_details = mongoose.Schema({
         position: String,
         points: Number,
         all_points: Number,
         matchday_num: Number,
         value: String,
         squad: String,
         created_at: {type: Date, default: Date.now},
         updated_at: {type: Date, default: Date.now}
         });*/

        var playerSchema = mongoose.Schema({
            name: String,
            url: String,
            full_url: String,
            comunio_id: String,
            started_at: Number,
            updated_at_matchday: Number,
            position: String,
            all_points: Number,
            points: [String],
            value: Number,
            played_matchdays: [String],
            created_at: {type: Date, default: Date.now},
            updated_at: {type: Date, default: Date.now}
        });

        var squadSchema = mongoose.Schema({
            name: String,
            url: String,
            full_url: String,
            image_url: String,
            season: String,
            all_points: Number,
            value: Number,
            players: [playerSchema],
            created_at: {type: Date, default: Date.now},
            updated_at: {type: Date, default: Date.now},
            updated_at_matchday: Number
        });
        squadSchema.set('collection', config.database);
        //Mongoose uses plural of model as collection, so collection name is "beers"
        // Matchday = mongoose.model("Matchday", matchday_details);
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

    function updateSquad(updateSquadObj) {
        return new Promise(function (resolve, reject) {
            Squad.count({"name": updateSquadObj.name}, function (err, count) {
                if (count != 0) {
                    Squad.findOneAndUpdate({"name": updateSquadObj.name}, {
                        $set: {
                            all_points: parseInt(updateSquadObj.all_points),
                            updated_a: Date.now(),
                            value: updateSquadObj.value
                        }
                    }, {
                        safe: true,
                        upsert: true,
                        new: true
                    }, function (err, updatedPlayer) {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            resolve("Update Complete");
                        }
                    });
                }
                else resolve([]);
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

    function updatePlayer(updatePlayer) {
        var points = updatePlayer.points;
        return new Promise(function (resolve, reject) {
            //db.comstats_16_17.findOne({'played_matchdays': {$nin: [21]} ,"players.comunio_id": "32508"}, {'players.$':1})
            Squad.findOne({
                'players.played_matchdays': {$nin: [updatePlayer.updated_at_matchday]},
                "players.comunio_id": updatePlayer.comunio_id
            }, {'players.$': 1}, function (err, player) {
                if (player != null) {


                    var allPoints = player.players[0].all_points;
                    //  if (updatePlayer.updated_at_matchday > lastUpdated) {
                    if (isNaN(parseInt(points))) {
                        points = "0";
                    }
                    var newPoints = parseInt(allPoints) + parseInt(points);
                    //  console.log(newPoints);
                    Squad.findOneAndUpdate({"players.comunio_id": updatePlayer.comunio_id}, {
                        $set: {
                            updated_at_matchday: updatePlayer.updated_at_matchday,
                            "players.$.last_points": updatePlayer.points,
                            "players.$.all_points": newPoints,
                            "players.$.updated_at": Date.now(),
                            "players.$.updated_at_matchday": updatePlayer.updated_at_matchday
                        },
                        $push: {
                            "players.$.points": updatePlayer.points,
                            "players.$.played_matchdays": updatePlayer.updated_at_matchday
                        }
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
                            resolve("Update Complete");
                        }
                    });
                }

                else {
                    resolve('No Update Available');
                }
            });
        });
    }

    function updatePlayerInfos(updatePlayerInfos) {
        return new Promise(function (resolve, reject) {
            Squad.findOne({
                "players.comunio_id": updatePlayerInfos.comunio_id
            }, {'players.$': 1}, function (err, player) {
                if (player != null) {
                    Squad.findOneAndUpdate({"players.comunio_id": updatePlayerInfos.comunio_id}, {
                        $set: {
                            "players.$.value": updatePlayerInfos.value,
                            "players.$.position": updatePlayerInfos.position
                        }
                    }, {
                        safe: true,
                        upsert: true,
                        new: true
                    }, function (err, updatedPlayer) {
                        //console.log(updatedPlayer.players[0].name)
                        if (err) {
                            console.log(err)
                            reject(err);
                        }
                        else {
                            resolve("Update Complete");
                        }
                    });
                }

                else {
                    resolve('No Update Available');
                }
            });
        });
    }


    // GET PLAYERS ---------------------
    // mongoose.set('debug', true);
    function getPlayerByName(name) {
        name = getCaseInsensitive(name);
        return new Promise(function (resolve, reject) {
            Squad.count({"players.name": name}, function (err, count) {
                if (count > 0) {
                    Squad.findOne({"players.name": name}, {'players.$': 1}, function (err, player) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(player);
                        }
                    });
                }
                else resolve([]);
            });
        });
    }

    function getPlayerByComunioID(comunioID) {
        return new Promise(function (resolve, reject) {
            Squad.count({"players.comunio_id": comunioID}, function (err, count) {
                if (count > 0) {
                    Squad.findOne({"players.comunio_id": comunioID}, {'players.$': 1}, function (err, player) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(player);
                        }
                    });
                }
                else resolve([]);
            });
        });
    }

// db.comstats_16_17.findOne({"comunio_id": "32508"}, {'players.$':1})
    function getPlayerById(id) {
        return new Promise(function (resolve, reject) {
            Squad.count({"players._id": id}, function (err, count) {
                if (count > 0) {
                    Squad.findOne({"players._id": id}, {'players.$': 1}, function (err, player) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(player);
                        }
                    });
                }
                else resolve([]);
            });
        });
    }

    //-----------------------


    //-----------------------

    //GET POINTS

    function getLastPointsByPlayerName(name) {
        name = getCaseInsensitive(name);
        return new Promise(function (resolve, reject) {
            Squad.count({"players.name": name}, function (err, count) {
                if (count > 0) {
                    Squad.findOne({"players.name": name}, {'players.$': 1}, function (err, player) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(player.players[0].last_points);
                        }
                    });
                }
                else {
                    resolve([])
                }
            });
        });
    }

    function getLastPointsByPlayerComunioID(comunioID) {
        return new Promise(function (resolve, reject) {
            Squad.count({"players.comunio_id": comunioID}, function (err, count) {

                if (count > 0) {
                    Squad.findOne({"players.comunio_id": comunioID}, {'players.$': 1}, function (err, player) {

                        if (err) {
                            reject(err);
                        } else {
                            resolve(player.players[0].last_points);
                        }
                    });
                }
                else {
                    resolve([]);
                }
            });
        });
    }

    function getLastPointsByPlayerID(id) {
        return new Promise(function (resolve, reject) {
            Squad.count({"players._id": id}, function (err, count) {
                if (count > 0) {
                    Squad.findOne({"players._id": id}, {'players.$': 1}, function (err, player) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(player.players[0].last_points);
                        }
                    });
                }
                else {
                    resolve([]);
                }
            });
        });
    }

    function getPlayerByNameAutocomplete(name) {
        name = getCaseInsensitive(name);
        return new Promise(function (resolve, reject) {
            Squad.count({"players.name": name}, function (err, count) {
                if (count > 0) {
                    Squad.findOne({"players.name": name}, {'players.$.name': 1}, function (err, player) {
                        if (err) {
                            reject(err);
                        } else {
                            var data = {name: player.players[0].name, _id: player.players[0]._id};
                            resolve(data);
                        }
                    });
                }
                else resolve([]);
            });
        });
    }

    /**
     * @todo
     * @param squadName
     * @return {Promise}
     */
    function getSquadLastWeekPoints(squadName) {
        return new Promise(function (resolve, reject) {
            Squad.find({name: squadName}, {_id: 0, last_points: 1}, function (err, points) {
                resolve(points[0].last_points);
            });
        });
    }

    //---------------------------


    //GET SQUADS --------------
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


    function getSquadByName(name) {
        name = getCaseInsensitive(name);
        return new Promise(function (resolve, reject) {
            Squad.count({name: name}, function (err, count) {
                if (count > 0) {
                    Squad.findOne({name: name}, function (err, squad) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(squad);
                        }
                    });
                }
                else {
                    resolve([]);
                }
            });
        });
    }

    function getSquadById(id) {
        return new Promise(function (resolve, reject) {
            Squad.count({_id: id}, function (err, count) {
                if (count > 0) {
                    Squad.find({_id: id}, function (err, squad) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(squad);
                        }
                    });
                }
                else {
                    resolve([]);
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

    function getCaseInsensitive(term) {
        return new RegExp(term, "i");
    }

    function isConnected() {
        return connected;
    }

    that.init = init;
    that.connect = connect;
    that.getAllSquads = getAllSquads;
    that.deleteBeer = deleteBeer;
    that.getSquadByName = getSquadByName;
    that.getPlayerByName = getPlayerByName;
    that.getPlayerByNameAutocomplete = getPlayerByNameAutocomplete;
    that.getPlayerById = getPlayerById;
    that.getPlayerByComunioID = getPlayerByComunioID;
    that.isConnected = isConnected;
    that.insertSquad = insertSquad;
    that.getSquadLastWeekPoints = getSquadLastWeekPoints;
    that.getLastPointsByPlayerName = getLastPointsByPlayerName;
    that.getLastPointsByPlayerID = getLastPointsByPlayerID;
    that.getLastPointsByPlayerComunioID = getLastPointsByPlayerComunioID;
    that.getSquadById = getSquadById;
    that.updateSquad = updateSquad;
    that.updatePlayer = updatePlayer;
    that.updatePlayerInfos = updatePlayerInfos;
    return that;
})();
