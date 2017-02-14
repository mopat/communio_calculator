/**
 * Created by morcz on 21.01.2017.
 */
var bodyParser = require("body-parser");
var express = require("express");
var crawl = require('./crawl.js');
var config = require("./Config.json");
var database = require("./Database.js");

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.get('/matchday_results', function (req, res) {
    res.sendFile('results.html', {root: __dirname});
});
/*
 DEFAULT URL WITH PORT 8000: localhost:8000/beer
 */

/*
 GET Routes
 */
app.get("/", function () {
    res.end('API START')
});

//UPDATE AND INIT FUNCTIONS -----------------
app.get("/init_squads", function (req, res) {
    crawl.initSquads().then(function (squads) {
        if (squads.length == 0) {
            res.end('No beer in database');
        }
        else
            res.json(squads);
    }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.get("/update_players", function (req, res) {
    crawl.updatePlayers().then(function (player) {
        if (player.length == 0) {
            res.end('No squad updated');
        }
        else
            res.json(player);
    }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.get("/update_squads", function (req, res) {

    crawl.updateSquads().then(function (squads) {
        if (squads.length == 0) {
            res.end('No squad updated');
        }
        else
            res.json(squads);
    }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.get("/update_player_infos", function (req, res) {

    crawl.updaePlayerInfos().then(function (squads) {
        if (squads.length == 0) {
            res.end('No squad updated');
        }
        else
            res.json(squads);
    }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
    });
});
//------------------------------------------

// SQUAD Endpoints ------------------------

app.get("/squads", function (req, res, next) {
    var name = req.query.name;
    if (name == undefined) {
        next();
        return;
    }

    database.getSquadByName(name).then(function (squad) {
        if (squad.length == 0) {
            res.end('Cannot find squad with name: ' + name);
        }
        else
            res.json(squad);
    })
});


app.get("/squads", function (req, res) {
    database.getAllSquads().then(function (squads) {
        if (squads.length == 0) {
            res.end('No beer in database');
        }
        else
            res.json(squads);
    }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
    });
});


app.get("/squads/:id", function (req, res) {
    var id = req.params.id;
    database.getSquadById(id).then(function (squad) {
        if (squad.length == 0) {
            res.end('Cannot find squad with id: ' + id);
        }
        else
            res.json(squad);
    })
});

//-----------------------

//PLAYER Endpoints-----------------------
app.get("/players/:id", function (req, res) {
    var id = req.params.id;
    database.getPlayerById(id).then(function (player) {
        if (player.length == 0) {
            res.end('Cannot find player with name: ' + name);
        }
        else
            res.json(player);
    })
});

app.get("/players", function (req, res, next) {
    var name = req.query.name;
    if (name == undefined) {
        next();
        return;
    }
    database.getPlayerByName(name).then(function (player) {
        if (player.length == 0) {
            res.end('Cannot find player with name: ' + name);
        }
        else
            res.json(player);
    })
});

app.get("/players", function (req, res) {
    var comunioID = req.query.comunio_id;
    database.getPlayerByComunioID(comunioID).then(function (player) {
        if (player.length == 0) {
            res.end('Cannot find player with name: ' + comunioID);
        }
        else
            res.json(player);
    })
});


app.get("/players/autocomplete", function (req, res) {
    var name = req.query.name;
    database.getPlayerByNameAutocomplete(name).then(function (player) {
        if (player.length == 0) {
            res.end('Cannot find player with name: ' + name);
        }
        else
            res.json(player);
    })
});


//----------------

app.get("/points/player", function (req, res, next) {
    var name = req.query.name;
    if (name == undefined) {
        next();
        return;
    }
    database.getLastPointsByPlayerName(name).then(function (points) {
        if (points.length == 0) {
            res.end('Cannot find player with name: ' + name);
        }
        else
            res.json(points);
    })
});

app.get("/points/player", function (req, res) {
    database.getLastPointsByPlayerComunioID(comunioID).then(function (points) {
        if (points.length == 0) {
            res.end('Cannot find player with comunio_id: ' + comunioID);
        }
        else
            res.json(points);
    })
});

app.get("/points/player/:id", function (req, res) {
    var id = req.params.id;
    database.getLastPointsByPlayerID(id).then(function (points) {
        if (points.length == 0) {
            res.end('Cannot find player with id: ' + id);
        }
        else
            res.json(points);
    })
});

app.get("/points/squads/:id", function (req, res) {
    var id = req.params.id;
    database.getSquadLastWeekPoints(id).then(function (points) {
        if (points.length == 0) {
            res.end('Cannot find squad with id: ' + id);
        }
        else
            res.json(points);
    })
});


app.listen(8000, function () {
    console.log('Listening To Port 8000');
});
