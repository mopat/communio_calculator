/**
 * Created by morcz on 21.01.2017.
 */
var mongoose = require("mongoose");

var Squad;
var Player;

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
            points: [],
            matchday_num: String,
            value: String,
            squad: String
        });

        var playerSchema = mongoose.Schema({
            name: String,
            url: String,
            full_url: String,
            comunio_id: String,
            matchday_details: matchday_details,
            started_at: String,
            last_points: Number
        });

        var squadSchema = mongoose.Schema({
            name: String,
            url: String,
            full_url: String,
            image_url: String,
            season: String,
            players: [playerSchema]
        });
        squadSchema.set('collection', config.database);
        //Mongoose uses plural of model as collection, so collection name is "beers"
        Player = mongoose.model("Player", squadSchema);
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
        // console.log(squadObj)
        var squad = new Squad(squadObj);
        return new Promise(function (resolve, reject) {
            Squad.count({name: squadObj.name}, function (err, count) {
                console.log(count)
                if (count == 0) {
                    squad.save(function (err, squad) {
                        console.log(squad);
                        if (err) {
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

    function updatePlayer(updatePlayer) {
        // console.log(player.comunio_id, player.matchday_details.points)
        return new Promise(function (resolve, reject) {
            Squad.findOne({"players.comunio_id": updatePlayer.comunio_id}, {'players.$': 1}, function (err, player) {
                var lastMatchDayPoints = parseInt(player.players[0].matchday_details.points[player.players[0].matchday_details.points.length - 1]);
                console.log(updatePlayer.matchday_details.points)
                //var currentMatchdayPoints = updatePlayer.
                if (parseInt(updatePlayer.matchday_details.points) != parseInt(lastMatchDayPoints)) {

                }
                var pointsDif = parseInt(updatePlayer.matchday_details.points) - parseInt(lastMatchDayPoints);
                console.log(parseInt(updatePlayer.matchday_details.points), parseInt(lastMatchDayPoints));
                Squad.findByIdAndUpdate(mongoose.Types.ObjectId(player._id), {
                    $push: {points: updatePlayer.points},
                    $set: {last_points: pointsDif}
                }, {
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
             
            });
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
    that.updatePlayer = updatePlayer;
    return that;
})();
