/**
 * Created by Patrick on 14.02.2017.
 */
var API_URL = 'http://localhost:8000/';
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
                        var playerLastPoints = playerData.last_points;
                        var comunioID = playerData.comunio_id;
                        console.log(playerName, playerLastPoints);
                        $('#results').append(playerName + ": " + playerLastPoints + "; comunioID: " + comunioID + "<br>");
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

                var playerData = response.players[0];
                var playerName = playerData.name;
                var playerLastPoints = parseInt(playerData.last_points);
                if (isNaN(playerLastPoints)) {
                    playerLastPoints = 0;
                }
                squadPoints += playerLastPoints;
                console.log(squadPoints);
                var comunioID = playerData.comunio_id;
                console.log(playerName, playerLastPoints);
                $('#results').append("Teampunkte: " + squadPoints);

            },
            error: function (error) {

            }
        });
    }
}