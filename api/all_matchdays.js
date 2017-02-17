var url = "http://www.comstats.de/matchday";
var page = require('webpage').create();

var fs = require('fs');
var system = require('system');
page.onConsoleMessage = function (msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};
matchdayNum = 1;
loadAllMatchdays();
var tDif;
var time = Date.now();


page.onLoadFinished = function () {
    console.log("page load finished");


    // console.log(tDif)
    time = Date.now();
    clearInterval(myVar);
    myVar = setInterval(function () {
        console.log("INTERVAL")
        tDif = Date.now() - time;
        //console.log(tDif)
        if (tDif > 10000) {
            console.log("complete " + matchdayNum);
            page.render(matchdayNum.toString() + '.png');
            fs.write(matchdayNum.toString() + '.html', page.content, 'w');
            matchdayNum++;
            clearInterval(myVar);
            if (matchdayNum > 20) {
                phantom.exit();
                return;
            }
            loadAllMatchdays()
        }
    }, 100);
    // interval();


};
complete = false;

function interval() {

}


page.onCallback = function (data) {
    console.log(data)
    if (data.exit) {
        page.render('imgName.png');
        page.render('pdfName.pdf');
    }
};

function loadAllMatchdays() {
    page.open(url + "/2017/" + matchdayNum.toString(), function (status) {
        page.evaluate(function () {
            var showResults = document.getElementsByClassName('detailsPlus');
            for (var i = 0; i < showResults.length; i++) {
                if (showResults[i] != undefined) {
                    showResults[i].click();
                }
            }
            complete = true;
            console.log(complete);
        }, function (result) {

        });
    });
}