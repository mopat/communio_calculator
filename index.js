/**
 * Created by morcz on 21.01.2017.
 */
var bodyParser = require("body-parser");
var express = require("express");
var crawl = require('./crawl.js');
var config = require("./Config.json");

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
/*
 DEFAULT URL WITH PORT 8000: localhost:8000/beer
 */

/*
 GET Routes
 */
app.get("/", function () {
    res.end('API START')
});

app.get("/squads", function (req, res) {
    crawl.squads().then(function (beers) {
        if (beers.length == 0) {
            res.end('No beer in database');
        }
        else
            res.json(beers);
    }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
    });
});


app.listen(8000, function () {
    console.log('Listening To Port 8000');
});
