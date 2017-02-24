/**
 * Created by Patrick on 14.02.2017.
 */
var API_URL = 'http://localhost:8000/';
//var API_URL = 'http://comstatsapi.localtunnel.me/';
//var API_URL = 'https://042fdcf3.ngrok.io/';
var $matchdaySelect = $('#matchday-select');
$(document).ready(function () {
    //  $('select').material_select();
    init();
    getMyPlayers();
    $('#update').click(function () {
        getMyPlayers();
    })
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
                            $('#results').append(playerName + ": Keine Daten für diesen Speiltag vorhanden<br>")

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
    var playersComunioIDs = ['32192', '32522', '32323', '27620', '31273', '32632', '32205', '32584', '31596', '32342', '31419'];
    var squadPoints = 0;
    $('#results').empty();
    for (var i = 0; i < playersComunioIDs.length; i++) {
        $.ajax({
            url: API_URL + "players?comunio_id=" + playersComunioIDs[i],
            type: "get",
            dataType: "json",
            beforeSend: function () {

            },
            success: function (response) {
                console.log(response.players[0]);


                var matchday = $matchdaySelect.val();
                var playerData = response.players[0];
                var playerName = playerData.name;
                var matchdayPoints = playerData[matchday];
                $('#results').append(playerName + ": " + matchdayPoints + "<br>");
                /*  if (isNaN(matchdayPoints)) {
                 matchdayPoints = 0;
                 }*/
                if (matchdayPoints != undefined && matchdayPoints != null) {
                    squadPoints += parseInt(matchdayPoints);
                }

                console.log(squadPoints);
                var comunioID = playerData.comunio_id;
                console.log(playerName, matchdayPoints);

                $('#squad-points').html(squadPoints);
            },
            error: function (error) {

            }
        });

    }

}