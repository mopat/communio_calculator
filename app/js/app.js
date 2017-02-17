/**
 * Created by Patrick on 14.02.2017.
 */
var API_URL = 'http://localhost:8000/';
//var API_URL = 'http://comstatsapi.localtunnel.me/';
$(document).ready(function () {
    init();
    getMyPlayers();
});

function init() {
    playerAutocomplete();
}

function playerAutocomplete() {
    $('#find-player').keydown(function () {
        var value = $(this).val();
        if (value.length < 3) {
            $('#results').empty();
            return;
        }
        $.ajax({
                url: API_URL + "players?name=" + value,
                type: "get",
                dataType: "json",
                success: function (response) {
                    console.log(response);
                    $('#results').empty();
                    for (var i = 0; i < response.length; i++) {
                        var playerData = response[i].players[0];
                        var playerName = playerData.name;
                        var $matchdaySelect = $('#matchday-select');
                        var matchday = $matchdaySelect.val();
                        var matchdayPoints = playerData[matchday];
                        var comunioID = playerData.comunio_id;
                        if (matchdayPoints != undefined && matchdayPoints != null) {
                            $('#results').append(playerName + ": " + matchdayPoints + "; comunioID: " + comunioID + "<br>");
                        }
                        else {
                            $('#results').append("Keine Daten für diesen Speiltag vorhanden")

                        }
                        console.log(playerName, matchdayPoints);

                    }
                },
                error: function (error) {

                }
            }
        )
    });
}

function getMyPlayers() {
    var playersComunioIDs = ['32192', '32099', '32522', '32323', '27620', '31273'];
    var squadPoints = 0;
    for (var i = 0; i < playersComunioIDs.length; i++) {
        $.ajax({
            url: API_URL + "players?comunio_id=" + playersComunioIDs[i],
            type: "get",
            dataType: "json",
            success: function (response) {
                console.log(response.players[0]);
                $('#results').empty();
                var $matchdaySelect = $('#matchday-select');
                var matchday = $matchdaySelect.val();
                var playerData = response.players[0];
                var playerName = playerData.name;
                var matchdayPoints = playerData[matchday];
                /*  if (isNaN(matchdayPoints)) {
                 matchdayPoints = 0;
                 }*/
                if (matchdayPoints != undefined && matchdayPoints != null) {
                    squadPoints += parseInt(matchdayPoints);
                }

                console.log(squadPoints);
                var comunioID = playerData.comunio_id;
                console.log(playerName, matchdayPoints);
                $('#results').append("Teampunkte: " + squadPoints);

            },
            error: function (error) {

            }
        });
    }
}