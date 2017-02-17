/**
 * Created by morcz on 21.01.2017.
 */
var Crawler = require("crawler");
var cheerio = require('cheerio');
var request = require('request');
var url = require('url');

var config = require("./Config.json");
var database = require("./Database.js");

var MATCHDAY_RESULTS = 'http://localhost:8000/matchday_results';
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
        console.log("There was an error connecting to the database!");
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


    function updatePlayers() {
        return new Promise(function (resolve, reject) {
            request({
                method: 'GET',
                url: MATCHDAY_RESULTS
            }, function (err, response, body) {
                if (err) return console.error(err);

                // Tell Cherrio to load the HTML
                $ = cheerio.load(body);
                var matchdayNum = parseInt($('title').html().split('.')[0]);
                $('.sptPaarDetails').each(function () {
                    var $table = $($(this).find('table'));
                    $table.each(function () {
                        var $row = $($(this).find('tr'));
                        $row.each(function () {
                            var $data = $($(this).find('td'));
                            var playerName = $(this).find('.playerName a').text().trim();
                            if (playerName != undefined) {
                                var comunioId = $($(this).find('.playerName')).attr('id');
                                if (comunioId != undefined)
                                    comunioId = comunioId.toString().replace('player', '');

                                var points = $($(this).find('td.right')).text();

                                // console.log(playerName, points)
                                var updatePlayer = {
                                    name: playerName,
                                    comunio_id: comunioId,
                                    points: points,
                                    updated_at_matchday: matchdayNum
                                };
                                if (updatePlayer.comunio_id != undefined) {
                                    resolve(database.updatePlayer(updatePlayer));
                                }

                            }

                        });

                    });
                });
                if (err) {
                    reject(err);
                } else {
                    resolve($('.clubname').text().trim());
                }
            });
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
                        resolve(database.getAllSquads());
                    }
                    done();
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
                                    value: 0,
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
                                    var allPoints = parseInt($('.rangliste').find('td.bold.right').first().text());
                                    var value = parseInt($('.rangliste').find('td.bold.right').last().text().replace(/\./g, ''));
                                    $($('.rangliste').find('tr')).each(function (j, elem) {
                                        var row = $(elem);
                                        var td = $(row).find('td.right');
                                        var playerName = $(row).find('td.playerCompare').text().trim();
                                        var url = $(row).find('td a.nowrap').attr('href');
                                        var comunio_id = $(row).find('div.compare').attr('data-basepid');
                                        var position = $(row).find('td.left').last().text();

                                        var points = $(row).find('td.right').first().text();
                                        var playerValue = parseInt($(row).find('td.right').last().text().replace(/\./g, ''));

                                        //not working for es
                                        var matchDayNum = $($('.titlecontent').find('h2')[1]).html().split(" ")[0].replace(".", " ").trim();

                                        /*   var matchdayDetails = {
                                         position: position,
                                         points: 0,
                                         all_points: points,
                                         matchday_num: parseInt(matchDayNum),
                                         value: value,
                                         squad: currentSquad.name
                                         };
                                         */
                                        var player = {
                                            name: playerName,
                                            url: url,
                                            comunio_id: comunio_id,
                                            full_url: COMSTATS_URL + url,
                                            updated_at_matchday: parseInt(matchDayNum),
                                            started_at: parseInt(matchDayNum),
                                            last_points: "init",
                                            value: playerValue,
                                            position: position,
                                            played_matchdays: [],
                                            all_points: points,
                                            points: []
                                        };

                                        if (player.name != "") {
                                            currentSquad.all_points = allPoints;
                                            currentSquad.value = value;
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
                                            resolve(database.getAllSquads());
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

    //for storing ion database
    function updaePlayerInfos() {
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
                                    value: 0,
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
                                    var allPoints = parseInt($('.rangliste').find('td.bold.right').first().text());
                                    var value = parseInt($('.rangliste').find('td.bold.right').last().text().replace(/\./g, ''));
                                    $($('.rangliste').find('tr')).each(function (j, elem) {
                                        var row = $(elem);
                                        var td = $(row).find('td.right');
                                        var playerName = $(row).find('td.playerCompare').text().trim();
                                        var url = $(row).find('td a.nowrap').attr('href');
                                        var comunio_id = $(row).find('div.compare').attr('data-basepid');
                                        var position = $(row).find('td.left').last().text();

                                        var points = $(row).find('td.right').first().text();
                                        var playerValue = parseInt($(row).find('td.right').last().text().replace(/\./g, ''));

                                        //not working for es
                                        var matchDayNum = $($('.titlecontent').find('h2')[1]).html().split(" ")[0].replace(".", " ").trim();

                                        var updatePlayerInfos = {
                                            comunio_id: comunio_id,
                                            value: playerValue,
                                            all_points: points,
                                            position: position
                                        };
                                        database.updatePlayerInfos(updatePlayerInfos);
                                    });

                                    builtSquads.push(currentSquad);
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
    //for storing ion database
    function updateSquads() {
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
                                    last_points: "0",
                                    players: []
                                };
                                squads.push(squad);
                            });
                        });
                        //console.log(squads);
                        count = 0;
                        loadSquads();

                        function loadSquads() {
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
                                    var allPoints = parseInt($('.rangliste').find('td.bold.right').first().text());
                                    var value = parseInt($('.rangliste').find('td.bold.right').last().text().replace(/\./g, ''));

                                    if (currentSquad.name != "") {
                                        currentSquad.all_points = allPoints;
                                        currentSquad.value = value;
                                    }

                                    database.updateSquad(currentSquad);
                                    builtSquads.push(currentSquad);
                                    if (count < squads.length - 1) {
                                        count++;
                                        loadSquads();
                                    }
                                    else {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(database.getAllSquads());
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
    that.updatePlayers = updatePlayers;
    that.updaePlayerInfos = updaePlayerInfos;
    return that;
})();
