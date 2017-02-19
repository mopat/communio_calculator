/**
 * Created by morcz on 21.01.2017.
 */
var mongoose = require("mongoose");
var utf8 = require('utf8');
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
            last_points: String,
            all_points: Number,
            points: [String],
            value: Number,
            played_matchdays: [String],
            created_at: {type: Date, default: Date.now},
            updated_at: {type: Date, default: Date.now}
        }, {strict: false});

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
        }, {strict: false});
        squadSchema.set('collection', config.database);
        //Mongoose uses plural of model as collection, so collection name is "beers"
        // Matchday = mongoose.model("Matchday", matchday_details);

        Player = mongoose.model("Player", playerSchema);
        Squad = mongoose.model("Squad", squadSchema);

        Player.update({}, {'players.$.21': false}, {}, function (err, players) {
            if (err) {
                console.log(err)
            } else {
                /*  var data = {
                 name: players.players[0].name,
                 _id: players.players[0]._id,
                 comunio_id: players.players[0].comunio_id,
                 full_url:  players.players[0].full_url,
                 };*/
                console.log("players")


            }
        });
        /*     Squad.findOneAndUpdate({"players.comunio_id": 35}, {
         $set: {
         "players.$.21": ""
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
         });*/
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

    function updateMatchday(matchdayMatchData) {
        return new Promise(function (resolve, reject) {
            var matchday_key = matchdayMatchData.matchday_num;
            var set = {updated_at: Date.now()};
            set[matchday_key] = matchdayMatchData.formatted_result_and_time;

            /*
             // Unset field
             Squad.update({}, {$unset: {"21": 1 }}, {multi: true}, function (err, squad) {
             console.log(squad)
             });
             */

            // Update home
            Squad.update({name: matchdayMatchData.home}, {$set: set}, {multi: true}, function (err, updatedSquadMatchday) {
                // Update away
                Squad.update({name: matchdayMatchData.away}, {$set: set}, {multi: true}, function (err, updatedSquadMatchday) {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(updatedSquadMatchday);
                    }
                });
            });
        });
    }

    function updatePlayer(updatePlayer) {
        /*        var objName = updatePlayer.updated_at_matchday.toString();
         var addMatchdayObj = {};
         addMatchdayObj[updatePlayer.updated_at_matchday.toString()]= String;
         mongoose.model('Player').schema.add(addMatchdayObj);*/
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
                    var matchday_key = "players.$." + updatePlayer.updated_at_matchday.toString();
                    var set = {
                        updated_at_matchday: updatePlayer.updated_at_matchday,
                        "players.$.last_points": updatePlayer.points,
                        "players.$.all_points": newPoints,
                        "players.$.updated_at": Date.now(),
                        "players.$.updated_at_matchday": updatePlayer.updated_at_matchday
                    };
                    set[matchday_key] = points;
                    Squad.findOneAndUpdate({"players.comunio_id": updatePlayer.comunio_id}, {
                        $set: set,
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
                console.log(count)
                if (count > 0) {
                    Squad.find({"players.name": name}, {'players.$': 1}, function (err, player) {
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
                    Squad.find({"players.name": name}, {'players.$': 1}, function (err, players) {
                        if (err) {
                            reject(err);
                        } else {
                            /*  var data = {
                             name: players.players[0].name,
                             _id: players.players[0]._id,
                             comunio_id: players.players[0].comunio_id,
                             full_url:  players.players[0].full_url,
                             };*/
                            resolve(players);
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
                    Squad.find({name: name}, function (err, squad) {
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

    function getSquadByNameAutocomplete(name) {
        name = getCaseInsensitive(name);
        return new Promise(function (resolve, reject) {
            Squad.count({"name": name}, function (err, count) {
                if (count > 0) {
                    Squad.find({"name": name}, function (err, squads) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(squads);
                            var data = {
                                name: squads.name,
                                _id: squads._id,
                                full_url: squads.full_url
                            };
                            resolve(squads);
                        }
                    });
                }
                else resolve([]);
            });
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
    that.getSquadByNameAutocomplete = getSquadByNameAutocomplete;
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
    that.updateMatchday = updateMatchday;
    return that;
})();
