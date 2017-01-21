/**
 * Created by morcz on 21.01.2017.
 */
var mongoose = require("mongoose");

var squad;

module.exports = (function () {
    var that = {},
        db = mongoose.connection,
        url,
        connected = false;

    function init(config) {
        url = "mongodb://" + config.host + ":" + config.port + "/" + config.database;

        // Model our Schema
        var BeerSchema = mongoose.Schema({
            name: String,
            manufacturer: String,
            age: Date,
            city: String,
            tags: [String]
        });
        //Mongoose uses plural of model as collection, so collection name is "beers"
        Beer = mongoose.model("Beer", BeerSchema);
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

    function getAllBeers() {
        return new Promise(function (resolve, reject) {
            Beer.find({}, function (err, beer) {
                if (err) {
                    reject(err);
                } else {
                    resolve(beer);
                }
            });
        });
    }

    function getBeerByName(name) {
        return new Promise(function (resolve, reject) {
            Beer.find({name: name}, function (err, beer) {
                if (err) {
                    reject(err);
                } else {
                    resolve(beer);
                }
            });
        });
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

    //example-data
    /*
     {
     "name": "Mooser Liesl",
     "manufacturer": "Arcobräu",
     "age":  -3785462746000 , //="1850-01-16T18:34:14.000Z"
     "city": "Mooos",
     "tags": ["Moos", "Liesl", "Helles"]
     }
     */
    function insertBeer(beerObj) {
        var beer = new Beer(beerObj);
        return new Promise(function (resolve, reject) {
            Beer.count({name: beerObj.name}, function (err, count) {
                if (count == 0) {
                    beer.save(function (err, beer) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(beer);
                        }
                    });
                }
                else resolve([]);
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

    }

    function getPlayerByName(name) {

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
    that.getAllBeers = getAllBeers;
    that.insertBeer = insertBeer;
    that.deleteBeer = deleteBeer;
    that.addTagToBeer = addTagToBeer;
    that.getBeerByManufacturer = getBeerByManufacturer;
    that.getBeerByName = getBeerByName;
    that.isConnected = isConnected;
    return that;
})();
