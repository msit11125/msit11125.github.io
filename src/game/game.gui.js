$('#closeDiscription').on('click', function () {
    $('#discription').hide();

    // 開始遊戲
    resetGame();
});


$('#playerNameInput').on('change', function () {
    playerName = $('#playerNameInput').val();
});

/**
 * 
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