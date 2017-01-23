/**
 * Created by morcz on 21.01.2017.
 */
var Crawler = require("crawler");
var cheerio = require('cheerio');
var url = require('url');

var config = require("./Config.json");
var database = require("./Database.js");


var COMSTATS_URL = 'http://www.comstats.de';
var COMSTATS_SQUAD_URL = 'http://www.comstats.de/squad';

module.exports = (function () {
    var that = {},
        c = null;
    init();
    database.init(config);
    database.connect().then(function () {
        console.log("Database connection success!");
    }).catch(function (err) {
        console.log("There was an error!");
        console.log(err);
    });
    function init() {
        c = new Crawler({
            maxConnections: 500,
            // This will be called for each crawled page
            callback: function (error, res, done) {
                if (error) {
                    console.log(error);
                } else {
                    var $ = res.$;
                    // $ is Cheerio by default
                    //a lean implementation of core jQuery designed specifically for the server
                    console.log($("title").text());
                }
                done();
            }
        });
    }

    function listSquads() {
        return new Promise(function (resolve, reject) {
            c.queue([{
                uri: COMSTATS_SQUAD_URL,
                jQuery: false,
                callback: function (error, res, done) {
                    if (error) {
                        console.log(error);
                    } else {
                        //   console.log('Grabbed', res.body, 'bytes');
                        var $ = cheerio.load(res.body);
                        var squads = [];
                        $('.clubPics').each(function (i, elem) {
                            var el = $(elem);
                            $(el.find('a')).each(function () {
                                var squadUrl = $(this).attr('href');
                                var squadName = $(this).find('img').attr('title');
                                var imageUrl = $(this).find('img').attr('src');
                                var squad = {
                                    name: squadName,
                                    url: squadUrl,
                                    season: "16/17",
                                    full_url: COMSTATS_URL + squadUrl,
                                    image_url: imageUrl,
                                    players: []
                                };
                                squads.push(squad);
                            });
                        });
                    }
                    if (error) {
                        reject(error);
                    } else {
                        resolve(squads);
                    }
                    done();
                }

            }
            ]);
        });
    }


    //for storing ion database
    function updateSquads() {
        var squads = [];
        return new Promise(function (resolve, reject) {
            c.queue([{
                uri: COMSTATS_SQUAD_URL,
                jQuery: false,
                maxConnections: 20,
                // The global callback won't be called
                callback: function (error, res, done) {
                    if (error) {
                        console.log(error);
                    } else {
                        //   console.log('Grabbed', res.body, 'bytes');
                        var $ = cheerio.load(res.body);

                        $('.clubPics').each(function (i, elem) {
                            var el = $(elem);
                            $(el.find('a')).each(function () {
                                var squadUrl = $(this).attr('href');
                                var squadName = $(this).find('img').attr('title');
                                var imageUrl = $(this).find('img').attr('src');
                                var season = "16/17";
                                var squad = {
                                    name: squadName,
                                    url: squadUrl,
                                    full_url: COMSTATS_URL + squadUrl,
                                    image_url: imageUrl,
                                    season: season,
                                    players: []
                                };
                                squads.push(squad);
                            });
                        });
                        //console.log(squads);
                        count = 0;
                        loadPlayers();

                        function loadPlayers() {
                            //iterate squads
                            var currentSquad = squads[count];

                            (function (currentSquad) { //start wrapper code
                                c.queue([{
                                    uri: currentSquad.full_url,
                                    jQuery: false,
                                    maxConnections: 20,

                                    // The global callback won't be called
                                    callback: callback
                                }]);
                            })(currentSquad);//passing in variable to var here

                            function callback(error, res, done) {

                                //console.log(currentSquad.name);
                                if (error) {
                                    console.log(error);
                                } else {
                                    database.getSquadLastWeekPoints(currentSquad.name).then(function (points) {
                                        console.log(points.last_points);
                                        var newPoints = $('.rangliste').find('td.bold.right').first().text();
                                        if (newPoints == points.last_points) {
                                            console.log("GLEICH")
                                        }
                                        //Überprüfen pb points gleich
                                    });
                                    var $ = cheerio.load(res.body);
                                    //iterate players
                                    var newPoints = $('.rangliste').find('td.bold.right').first().text();
                                    $($('.rangliste').find('tr')).each(function (j, elem) {
                                        var row = $(elem);
                                        var td = $(row).find('td.right');
                                        var playerName = $(row).find('td.playerCompare').text().trim();
                                        var url = $(row).find('td a.nowrap').attr('href');
                                        var comunio_id = $(row).find('div.compare').attr('data-basepid');
                                        var position = $(row).find('td.left').last().text();
                                        var points = $(row).find('td.right').first().text();
                                        var value = $(row).find('td.right').last().text();
                                        console.log()

                                        //not working for es
                                        var matchDayNum = $($('.titlecontent').find('h2')[1]).html().split(" ")[0].replace(".", " ").trim();

                                        var matchdayDetails = {
                                            position: position,
                                            points: points,
                                            matchday_num: parseInt(matchDayNum),
                                            value: value,
                                            squad: currentSquad.name
                                        };

                                        var player = {
                                            name: playerName,
                                            url: url,
                                            squad_points: newPoints,
                                            comunio_id: comunio_id,
                                            full_url: COMSTATS_URL + url,
                                            matchday_details: matchdayDetails
                                        };

                                        if (player.name != "") {
                                            currentSquad.players.push(player);
                                            // console.log(currentSquad.name)
                                            database.updatePlayer(player)
                                        }

                                    });

                                    if (count < squads.length - 1) {
                                        count++;
                                        loadPlayers();
                                    }
                                    else {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(database.getAllSquads());
                                        }
                                        done();
                                    }
                                }

                            }
                        }
                    }

                }
            }
            ]);
        });
    }

    //for storing ion database
    function initSquads() {
        var squads = [];
        return new Promise(function (resolve, reject) {
            var builtSquads = [];
            c.queue([{
                uri: COMSTATS_SQUAD_URL,
                jQuery: false,
                maxConnections: 20,
                // The global callback won't be called
                callback: function (error, res, done) {
                    if (error) {
                        console.log(error);
                    } else {
                        //   console.log('Grabbed', res.body, 'bytes');
                        var $ = cheerio.load(res.body);

                        $('.clubPics').each(function (i, elem) {
                            var el = $(elem);
                            $(el.find('a')).each(function () {
                                var squadUrl = $(this).attr('href');
                                var squadName = $(this).find('img').attr('title');
                                var imageUrl = $(this).find('img').attr('src');
                                var season = "16/17";
                                var squad = {
                                    name: squadName,
                                    url: squadUrl,
                                    full_url: COMSTATS_URL + squadUrl,
                                    image_url: imageUrl,
                                    season: season,
                                    last_points: 0,
                                    players: []
                                };
                                squads.push(squad);
                            });
                        });
                        //console.log(squads);
                        count = 0;
                        loadPlayers();

                        function loadPlayers() {
                            //iterate squads
                            var currentSquad = squads[count];

                            (function (currentSquad) { //start wrapper code
                                c.queue([{
                                    uri: currentSquad.full_url,
                                    jQuery: false,
                                    maxConnections: 20,

                                    // The global callback won't be called
                                    callback: callback
                                }]);
                            })(currentSquad);//passing in variable to var here

                            function callback(error, res, done) {
                                console.log(currentSquad.name)
                                if (error) {
                                    console.log(error);
                                } else {
                                    var $ = cheerio.load(res.body);
                                    //iterate players
                                    var last_points = parseInt($('.rangliste').find('td.bold.right').first().text());
                                    $($('.rangliste').find('tr')).each(function (j, elem) {
                                        var row = $(elem);
                                        var td = $(row).find('td.right');
                                        var playerName = $(row).find('td.playerCompare').text().trim();
                                        var url = $(row).find('td a.nowrap').attr('href');
                                        var comunio_id = $(row).find('div.compare').attr('data-basepid');
                                        var position = $(row).find('td.left').last().text();

                                        var points = [];
                                        points.push($(row).find('td.right').first().text());
                                        var value = $(row).find('td.right').last().text();

                                        //not working for es
                                        var matchDayNum = $($('.titlecontent').find('h2')[1]).html().split(" ")[0].replace(".", " ").trim();

                                        var matchdayDetails = {
                                            position: position,
                                            points: points,
                                            matchday_num: parseInt(matchDayNum),
                                            value: value,
                                            squad: currentSquad.name
                                        };

                                        var player = {
                                            name: playerName,
                                            url: url,
                                            comunio_id: comunio_id,
                                            full_url: COMSTATS_URL + url,
                                            started_at: parseInt(matchDayNum),
                                            last_points: 0,
                                            matchday_details: matchdayDetails
                                        };

                                        if (player.name != "") {
                                            currentSquad.last_points = last_points;
                                            currentSquad.players.push(player);
                                            // console.log(currentSquad.name)
                                        }
                                    });
                                    database.insertSquad(currentSquad);
                                    builtSquads.push(currentSquad);
                                    if (count < squads.length - 1) {
                                        count++;
                                        loadPlayers();
                                    }
                                    else {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(builtSquads);
                                        }
                                        done();
                                    }
                                    //  console.log(currentSquad);
                                }

                            }
                        }
                    }

                }
            }
            ]);
        });
    }


// Queue just one URL, with default callback
// c.queue('http://www.comstats.de/matchday/m3217/SC+Freiburg-FC+Bayern+M%C3%BCnchen');

// Queue a list of URLs
//c.queue(['http://www.google.com/','http://www.yahoo.com']);


// Queue some HTML code directly without grabbing (mostly for tests)
    c.queue([{
        html: '<p>This is a <strong>test</strong></p>'
    }]);
    that.init = init;
    that.listSquads = listSquads;
    that.initSquads = initSquads;
    that.updateSquads = updateSquads;
    return that;
})();
