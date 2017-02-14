/**
 * Created by Patrick on 14.02.2017.
 */
var API_URL = 'http://localhost:8000/';
$(document).ready(function () {
    init();
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