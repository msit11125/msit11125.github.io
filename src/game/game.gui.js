$('#closeDiscription').on('click', function () {
    $('#discription').hide();

    // 開始遊戲
    resetGame();
});


$('#playerNameInput').on('change', function () {
    playerName = $('#playerNameInput').val();
});

function initFirebase() {
    // Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyB2q7Dgyz0h65Kl-2s29CSX-wrsygW0KnE",
        authDomain: "game-62015.firebaseapp.com",
        databaseURL: "https://game-62015.firebaseio.com",
        projectId: "game-62015",
        storageBucket: "game-62015.appspot.com",
        messagingSenderId: "610443782334",
        appId: "1:610443782334:web:3ae14fa25c233cfa6fd6ef"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
}

function getTopBoard() {
    var db = firebase.firestore();
    var rankDatas = [];
    var topBoardList = $("#topBoardList");


    db.collection("TopBoard")
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                rankDatas.push(doc.data());
            });
            // 排序名次 (分數由大到小)
            rankDatas = rankDatas.sort(function (a, b) {
                    return a.score < b.score ? 1 : -1;
                })
                .slice(0, 10); // top 10 

            topBoardList.empty();
            rankDatas.forEach((data, index) => {
                var color = '#ffffff';
                if(playerName == data.playerName){
                    color = '#ffff00';
                }
                topBoardList.append(
                    $(`<p style="color:${color}">${index+1}. ${data.playerName} (${data.difficult})<span class="text-lightgreen float-right">${data.score}</span></p>`)
                );
            });
        });
}

function storeRank(data) {
    var db = firebase.firestore();
    db.collection("TopBoard")
        .add(data)
        .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
            console.error("Error adding document: ", error);
        });
}

/**
 * 繪製迷你地圖
 * @param {*} array2D 障礙物矩陣
 * @param {*} playerPoint 
 * @param {*} enemiesPoints
 */
function drawMiniMap(array2D, playerPoint, enemiesPoints) {

    const canvas = document.querySelector('#small-map');
    canvas.width = 250;
    canvas.height = 250;
    const cellSide = 250 / groundSize;

    var ctx = canvas.getContext('2d');

    for (let i = 0; i < array2D.length; i++) {

        for (let j = 0; j < array2D[i].length; j++) {
            let x = j * cellSide;
            let y = i * cellSide;

            cellColor = 'rgba(255,255,255,0.7)';

            if (array2D[i][j] === 1) cellColor = 'rgba(20,20,20,0.7)';

            // player position
            if (playerPoint) {
                if (i == playerPoint.row && j == playerPoint.col) cellColor = 'rgb(255,0,0)';
            }

            // enemies position
            if (enemiesPoints) {
                enemiesPoints.forEach(enemyPoint => {
                    if (i == enemyPoint.row && j == enemyPoint.col) cellColor = 'rgb(255,255,0)';
                });
            }

            ctx.beginPath();
            ctx.fillStyle = cellColor;
            ctx.fillRect(x, y, cellSide, cellSide);
        }
    }
}