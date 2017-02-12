var url = "http://www.comstats.de/matchday";
var page = require('webpage').create();

var fs = require('fs');
var system = require('system');
page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};
page.onLoadFinished = function () {

    console.log("page load finished");

    page.render('results.png');
    fs.write('results.html', page.content, 'w');




};

page.open(url, function (status) {
    page.evaluate(function () {
        var showResults = document.getElementsByClassName('detailsPlus');
        for (var i = 0; i < showResults.length; i++) {
            if (showResults[i] != undefined)
                showResults[i].click();
        }
        //page.render('results.png');

    }, function (result) {

    });
});