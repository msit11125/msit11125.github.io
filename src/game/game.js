var game = document.getElementById("game");

var camera, scene, renderer; // 相機, 場景, 渲染器

var stats; // fps

var cubeGeo, cubeMaterial; // 基本方塊
var objects; // 儲存棋盤上的所有空間物件
var eggs; // 複數豆子


var audioListener; // 接收聲音


var plane; // 地圖
var boxSize; // 方塊大小
var groundSize; // 棋盤大小
var bound; // 圍牆邊界

var obstacleMatrix; // 棋盤障礙物矩陣

// 遊戲狀態
const GameStatus = {
    Ready: 0,
    Start: 1,
    Pause: 2,
    GameOver: 3
};
var nowGameStatus = GameStatus.Ready;

var surviveSecond; // 存活秒數
var score; // 遊戲得分
var scroe_magnification = 0; //難度得分倍率
var difficult; // 遊戲難度 (愈低愈難)


// 全部敵人, 玩家
var enemies,
    player;

var enemyCount; // 敵人數量
const normal_difficult = 0.4; // 一般難度AI速度
const hard_difficult = 0.35; // 困難難度AI速度
const dante_difficult = 0.3; // 地獄難度AI速度

var playerName = "玩家" + makeid(5); // 玩家名稱

// 敵人 類別物件
function Enemy() {
    this.position_default = new THREE.Vector3(0, 0, 0);
    this.position = new THREE.Vector3(0, 0, 0);

    this.instance = null;
   
    this.pathObjects = {
        paths: [], // 路徑
        pathIndex: 0, // 索引
        randomChangeDirectionIndex: 0 // 隨機變換方向的時間點索引
    }
}
// 玩家 類別物件
function Player() {
    this.position_default = new THREE.Vector3(0, 0, 0);
    this.position = new THREE.Vector3(0, 0, 0);

    this.instance = null;
}


function parameters(enemyCount, difficult) {
    objects = [];
    eggs = [];
    boxSize = 1;
    groundSize = 36;
    bound = groundSize / 2 - boxSize / 2;

    randBlockCount = 200;
    score = 0;
    surviveSecond = 0;

    enemyCount = enemyCount;
    difficult = difficult; // 遊戲難度 (愈低愈難)

    // defaults 
    obstacleMatrix = newMatrix();
    difficult = 0.5;

    enemies = [];
    player = null;

    // 依數量 創造敵人
    for (var i = 0; i < enemyCount; i++) {
        var enemy = new Enemy();
        enemy.position_default = new THREE.Vector3(0, boxSize / 2, 0);
        enemies.push(enemy);
    }
    // 創造玩家
    player = new Player();
    player.position_default = new THREE.Vector3(0, boxSize / 2, 0);

}

/**
 * 建立基礎場景
 */
function basicSceneInit() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000);

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        24000
    );

    camera.position.set(0, 13, 7);

    // 渲染器設置
    renderer = new THREE.WebGLRenderer({
        antialias: false // 抗鋸齒
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.setClearColor(new THREE.Color(0x00000, 1.0));
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Cube 幾何
    cubeGeo = new THREE.BoxBufferGeometry(boxSize, boxSize, boxSize);
    var cubetexture = new THREE.TextureLoader().load('/assets/texture/minecraft/dirt.png');
    cubetexture.magFilter = THREE.NearestFilter;
    cubeMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: cubetexture
    });

    // Grid 網格
    // var gridHelper = new THREE.GridHelper(groundSize, groundSize / boxSize, 0xb3b3b3, 0xb3b3b3);
    // scene.add(gridHelper);

    // plane 地圖
    const planeSize = groundSize;
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
        "/assets/texture/minecraft/grass.png"
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / boxSize;
    texture.repeat.set(repeats, repeats);

    // plane
    var geometry = new THREE.PlaneGeometry(groundSize, groundSize);
    geometry.rotateX(-Math.PI / 2);

    plane = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
            //visible: false,
            //transparent: true,
            //opacity: 1,
            map: texture,
            color: 0xffffff,
            side: THREE.SingleSide
        }),
    );
    plane.castShadow = false;
    plane.receiveShadow = true;

    scene.add(plane);
    objects.push(plane);

    // skybox
    addSkyBox(scene, 2);


    // lights
    var ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff, 1.1); // intensity:100

    spotLight.target.position.set(0, 0, 0);
    spotLight.position.set(0, 20, 5) // 光線從正上偏下方打來
    spotLight.castShadow = true;
    scene.add(spotLight);

    var orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.target.set(0, 0, 0);
    orbitControls.enabled = true;
    orbitControls.keys = {};
    orbitControls.enableDamping = true; // smooth
    orbitControls.dampingFactor = 0.3;
    orbitControls.rotateSpeed = 1;

    // audio
    // create an AudioListener and add it to the camera
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    initEvents(camera, renderer);

    // stats 
    stats = initStats();


    game.appendChild(renderer.domElement);
    // render
    requestAnimationFrame(render);


}



// -----------------------------------------------------
// --------------------- Game 相關 ---------------------
// -----------------------------------------------------


var gameText = $(".gameText");
var startGameButton = $("#startGame");
var scoreBoard = $("#scoreBoard");
var surviveBoard = $("#surviveBoard");

// 開始遊戲
startGameButton.click(function (e) {
    if (nowGameStatus == GameStatus.Start) {
        gameActions(GameStatus.Pause);
    } else {
        gameActions(GameStatus.Start);
    }
});

// 隨機方法
function getRandom(min, max) {
    return Math.floor(Math.random() * max) + min;
};

function standardization(num) {
    return Math.ceil(num / boxSize) * boxSize + (boxSize / 2);
}

// 創造遊戲關卡
function GenerateGameLevel() {
    let voxels = []; // 障礙物和圍牆
    // 隨機生成玩家
    function createPlayerRandom() {
        // 生成玩家
        player.instance = makeInstance(scene, cubeGeo, 0xD11141, 0, playerName, false);
        player.instance.cube.position.copy(new THREE.Vector3(0, boxSize / 2, 0));
        player.instance.cube.add(camera);
        player.instance.cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2 + boxSize));
        player.instance.cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2 + boxSize));

        player.position_default = player.instance.cube.position.clone();
        player.position = player.instance.cube.position.clone();

        objects.push(player.instance.cube);
        scene.add(player.instance.cube);
    }

    // 隨機生成敵人
    function createEnemiesRandom(count) {
        function createEnemy(i) {
            var newEnemy = new Enemy();
            newEnemy.instance = makeInstance(scene, cubeGeo, 0xFFE364, 0, '敵人' + (i + 1), true);
            newEnemy.instance.cube.position.copy(new THREE.Vector3(0, boxSize / 2, 0));
            newEnemy.instance.cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2 + boxSize));
            newEnemy.instance.cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2 + boxSize));

            newEnemy.position_default = newEnemy.instance.cube.position.clone();
            newEnemy.position = newEnemy.instance.cube.position.clone();
            return newEnemy;
        }
        // 生成敵人
        for (var i = 0; i < count; i++) {
            enemies[i] = createEnemy(i);

            // 避免重疊及離玩家太近
            while ( Math.abs(enemies[i].position_default.x - player.position_default.x ) < 3
                && Math.abs(enemies[i].position_default.z - player.position_default.z) < 3) {
                enemies[i] = createEnemy(i); // 重新生成
            }

            objects.push(enemies[i].instance.cube);
            scene.add(enemies[i].instance.cube);
        }
    }

    // 隨機障礙物
    function createBlockRandom() {
        for (var i = 0; i < randBlockCount; i++) {
            // 增加障礙物
            let voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
            voxel.castShadow = true;
            voxel.receiveShadow = true;
            let voxelX = standardization(getRandom(-bound - boxSize, bound * 2 + boxSize));
            let voxelZ = standardization(getRandom(-bound - boxSize, bound * 2 + boxSize));

            // 避免重疊敵人
            let isRepeat = false;
            enemies.forEach(enemy => {
                if (enemy.position.x == voxelX && enemy.position.z == voxelZ) {
                    isRepeat = true;
                }
            });
            // 避免重疊玩家
            if (player.position.x == voxelX && player.position.z == voxelZ) {
                isRepeat = true;
            }

            if (isRepeat) {
                continue;
            }

            voxel.position.copy({
                x: voxelX,
                y: boxSize / 2,
                z: voxelZ
            });

            let blockPoint = xzToPoint(voxel.position.x, voxel.position.z);
            // 不重疊方塊
            if (obstacleMatrix[blockPoint.row][blockPoint.col] != 1) {
                // 加入方塊
                obstacleMatrix[blockPoint.row][blockPoint.col] = 1;
                voxels.push(voxel);
            }
        }
    }
    // 邊界圍牆
    function createBoundWall() {
        for (var direction = 1; direction <= 4; direction++) {
            var wallLen = bound * 2 + 1;

            // 增加牆壁
            const planeSize = groundSize;
            const texture = new THREE.TextureLoader().load(
                "/assets/texture/minecraft/dirt.png"
            );
            texture.wrapS = THREE.RepeatWrapping;
            texture.magFilter = THREE.NearestFilter;
            const repeats = planeSize / boxSize;
            texture.repeat.set(repeats, 1);

            wallGeo = new THREE.BoxBufferGeometry(wallLen, boxSize, 0.01);
            wallMaterial = new THREE.MeshLambertMaterial({
                map: texture,
                side: THREE.DoubleSide
                // color: 0x7D5A33
            });

            let voxel = new THREE.Mesh(wallGeo, wallMaterial);
            voxel.receiveShadow = true;

            switch (direction) {
                case 1:
                    // 上
                    voxel.position.copy({
                        x: 0,
                        y: boxSize / 2,
                        z: -bound - 0.5
                    });
                    break;
                case 2:
                    // 左
                    voxel.position.copy({
                        x: -bound - 0.5,
                        y: boxSize / 2,
                        z: 0
                    });
                    voxel.rotateY(90 * Math.PI / 180)
                    break;
                case 3:
                    // 下
                    voxel.position.copy({
                        x: 0,
                        y: boxSize / 2,
                        z: bound + 0.5
                    });
                    break;
                case 4:
                    // 右
                    voxel.position.copy({
                        x: bound + 0.5,
                        y: boxSize / 2,
                        z: 0
                    });
                    voxel.rotateY(90 * Math.PI / 180)
                    break;
            }
            voxels.push(voxel);
        }
    }

    createPlayerRandom();
    createEnemiesRandom(enemyCount);
    createBlockRandom();
    createBoundWall();

    // 繪製迷你地圖
    var playerPoint = xzToPoint(player.position.x, player.position.z);
    var enemiesPoints = enemies.map(enemy => {
        return xzToPoint(enemy.position.x, enemy.position.z)
    });
    drawMiniMap(obstacleMatrix, playerPoint, enemiesPoints);

    enemies.forEach((enemy, i) => {
        enemy.pathObjects.paths = [];
        var path = findPath(enemy, player);
        enemy.pathObjects.paths = path;
    });

    // 場景放入障礙物和圍牆
    voxels.forEach((voxel) => {
        scene.add(voxel);
        objects.push(voxel);
    });
};

// AI到玩家的路徑
function findPath(enemy, player) {

    var path_array;

    const enemyPoint = xzToPoint(enemy.position.x, enemy.position.z);
    const playerPoint = xzToPoint(player.position.x, player.position.z);

    var grid = new PF.Grid(obstacleMatrix);
    var rndMethod = getRandom(1, 3);
    var rndFindPosition = getRandom(1, 3);
    var finder;

    switch (rndMethod) {
        case 1:
            finder = new PF.AStarFinder({
                allowDiagonal: false
            });
            break;
        case 2:
            finder = new PF.DijkstraFinder({
                allowDiagonal: false
            });
            break;
        case 3:
            finder = new PF.BreadthFirstFinder({
                allowDiagonal: false
            });
            break;
    }

    // 33% 機率隨機找點
    if (rndFindPosition == 1) {
        let voxelX = standardization(getRandom(-bound - boxSize, bound * 2));
        let voxelZ = standardization(getRandom(-bound - boxSize, bound * 2));

        // 隨機找點
        const rndPoint = xzToPoint(voxelX, voxelZ);
        path_array = finder.findPath(enemyPoint.col, enemyPoint.row, rndPoint.col, rndPoint.row, grid);

        if (path_array.length === 0) {
            path_array = finder.findPath(enemyPoint.col, enemyPoint.row, playerPoint.col, playerPoint.row, grid);
        }

    } else {
        // 66% 機率追玩家
        path_array = finder.findPath(enemyPoint.col, enemyPoint.row, playerPoint.col, playerPoint.row, grid);
    }

    // 隨機變換索引時間點
    enemy.randomChangeDirectionIndex = path_array.length > 10 ? 
    Math.floor(Math.random() * (path_array.length - 10)) + 10 // 10 ~ path.length
     : path_array.length; 

    return path_array;
}

/**
 * 遊戲動作
 * @param {*} state 依據GameStatus判斷
 */
function gameActions(state) {
    // Pause
    if (state == GameStatus.Pause) {
        gameText.text("Pause");
        gameText.show();

        enemies.forEach((enemy, i) => {
            enemy.pathObjects.pathIndex = 1;
        });

        startGameButton.text("繼續遊戲");

        nowGameStatus = GameStatus.Pause;
    }

    // Start
    if (state == GameStatus.Start) {
        let delayMSecond = 50; // 延遲開始
        if (nowGameStatus == GameStatus.GameOver ||
            nowGameStatus == GameStatus.Ready) {
            score = 0;
            surviveSecond = 0;

            eggs.forEach(egg => {
                scene.remove(egg);
            });
            eggs = [];

            setDifficult();

            enemies.forEach((enemy, i) => {
                enemy.pathObjects.pathIndex = 0;
                enemy.instance.cube.position.copy(enemy.position_default);
                enemy.position.copy(enemy.position_default);
            });

            player.instance.cube.position.copy(player.position_default);
            player.position.copy(player.position_default);

            delayMSecond = 2000;
        }

        nowGameStatus = GameStatus.Ready;

        // create Player Event
        initMoveEvent();

        // path finding logic
        enemies.forEach((enemy, i) => {
            enemy.pathObjects.paths = [];
            var path = findPath(enemy, player);
            enemy.pathObjects.paths = path;
            enemy.pathObjects.pathIndex = 1;
        });


        startGameButton.text("暫停");

        if (delayMSecond >= 1000) {
            gameText.show();
            var second = delayMSecond / 1000;
            gameText.text(second--);

            var reciprocal = setInterval(() => {
                gameText.text(second);
                second--;
            }, 1000);

            setTimeout(() => {
                nowGameStatus = GameStatus.Start;
                clearInterval(reciprocal);
                gameText.hide();
            }, delayMSecond);

        } else {
            nowGameStatus = GameStatus.Start;
            gameText.hide();
        }

    }

    // Game over
    if (state == GameStatus.GameOver) {
        gameText.html(`Game Over<br/><span class="text-warning">你的得分：${score}</span>`);
        gameText.show();
        makeSound(audioListener, '/assets/sounds/failure.ogg', 1);
        startGameButton.text("重新開始");

        // 儲存排名
        var data = {
            playerName: playerName,
            surviveSecond: surviveSecond,
            score: score,
            difficult: $("#difficultChoose").val(),
            createDate: new Date()
        };

        storeRank(data);
        getTopBoard();

        nowGameStatus = GameStatus.GameOver;
    }

    // Ready
    if (state == GameStatus.Ready) {

        startGameButton.text("開始遊戲");

        nowGameStatus = GameStatus.Ready;
    }
}


/**
 * X,Z位置換算矩陣Point位置
 * @param {*} x 
 * @param {*} z 
 */
function xzToPoint(x, z) {
    var col = (x + bound) / boxSize;
    var row = (z + bound) / boxSize;
    return {
        col: col,
        row: row
    };
}

/**
 * 平面兩點求角度
 * @param {*} p1 
 * @param {*} p2 
 */
function caculateVectorRotation(p1, p2) {
    // angle in radians
    var angleRadians = Math.atan2(p2.z - p1.z, p2.x - p1.x);
    // angle in degrees
    var angleDeg = angleRadians * 180 / Math.PI;

    return angleRadians;
}

function newMatrix() {
    var size = groundSize / boxSize;
    var matrix = [];
    for (var r = 1; r <= size; r++) {
        var insideArr = [];
        for (var c = 1; c <= size; c++) {
            insideArr.push(0);
        }
        matrix.push(insideArr);
    }
    return matrix;
}


// ------- 渲染工作 -------
var clock = new THREE.Clock();
var delta = 0;
var scorePlusTime = 0;

function render() {
    // 攝影機追隨
    camera.lookAt(player.instance.cube.position.x, player.instance.cube.position.y, player.instance.cube.position.z);

    // 更新enemy和player的標籤
    enemies.concat(player).forEach((cubeInfo, ndx) => {
        const {
            cube,
            elem
        } = cubeInfo.instance;
        const tempV = new THREE.Vector3();
        // get the position of the center of the cube
        cube.updateWorldMatrix(true, false);
        cube.getWorldPosition(tempV);
        // get the normalized screen coordinate of that position
        // x and y will be in the -1 to +1 range with x = -1 being
        // on the left and y = -1 being on the bottom
        tempV.project(camera);

        // convert the normalized position to CSS coordinates
        const x = (tempV.x * .5 + .5) * window.innerWidth;
        const y = (tempV.y * -.5 + .5) * window.innerHeight;
        // move the elem to that position
        elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    });

    // 更新其他
    stats.update();
    TWEEN.update();


    // ★ 判斷遊戲開始 ★ 
    if (nowGameStatus == GameStatus.Start) {

        var timespan = clock.getDelta();
        delta += timespan;
        scorePlusTime += timespan;
        // 移動頻率
        if (delta > difficult) {
            // AI 移動
            enemies.forEach((enemy, i) => {
                let coords = enemy.instance.cube.position; // init vector3
                var pathIdx = enemy.pathObjects.pathIndex;
                var path = enemy.pathObjects.paths;
                
                // 尚未換finding前
                if (pathIdx < enemy.randomChangeDirectionIndex) {
                    var next = path[pathIdx];
                    // -- 面對方向改變 --
                    // 上個位置
                    var p1 = {
                        x: coords.x,
                        z: coords.z
                    };
                    // 下個位置
                    var p2 = {
                        x: next[0] * boxSize - bound,
                        z: next[1] * boxSize - bound
                    }
                    if (p1.x == p2.x && p1.z == p2.z) {
                        return;
                    }

                    // -- AI 移動改變 --
                    let v = coords;
                    let vTo = new THREE.Vector3(p2.x, coords.y, p2.z);
                    enemy.position.x = vTo.x;
                    enemy.position.z = vTo.z;
                    new TWEEN.Tween(v)
                        .to(vTo, 1000 * difficult)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(() => {})
                        .onComplete(() => {
                            // 計算與玩家距離
                            var distanceX = Math.abs(vTo.x - player.position.x);
                            var distanceZ = Math.abs(vTo.z - player.position.z);
                            // 靠近才發出聲音
                            if (distanceX <= 10 && distanceZ <= 10) {
                                makeSound(audioListener, '/assets/sounds/footstep2.wav', 0.1);
                            }

                            if (eggs.length < 20 /* 最多20個在地圖上 */ &&
                                Math.random() > 0.9
                            ) {
                                // put egg
                                var egg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 30, 30), new THREE.MeshBasicMaterial({
                                    color: 0xffff00,
                                    transparent: true,
                                    opacity: 0.8,
                                }));
                                egg.castShadow = true;
                                egg.receiveShadow = true;

                                egg.position.copy(vTo);
                                scene.add(egg);
                                objects.push(egg);
                                eggs.push(egg);
                            }

                            // maps 更新
                            var playerPoint = xzToPoint(player.position.x, player.position.z);
                            var enemiesPoints = enemies.map(enemy => {
                                return xzToPoint(enemy.position.x, enemy.position.z)
                            });
                            drawMiniMap(obstacleMatrix, playerPoint, enemiesPoints);

                        })
                        .start();

                    var angleRadians = caculateVectorRotation(p1, p2) - (90 * Math.PI / 180);
                    enemy.instance.cube.rotation.y = -angleRadians;

                    enemy.pathObjects.pathIndex += 1;

                } else {
                    // 到換點索引後重新找點
                    enemy.pathObjects.paths = findPath(enemy, player);
                    enemy.pathObjects.pathIndex = 1;
                }
            });
            delta = 0;
        }
        // 每秒計分
        if (scorePlusTime > 1) {
            score += 1 * scroe_magnification;
            surviveSecond += 1;

            surviveBoard.text(surviveSecond)
            scoreBoard.text(score);
            scorePlusTime = 0;

            // AI速度提高
            if (score % 10 == 0) {
                difficult -= 0.005;
            }
        }
        // 檢查GameOver
        enemies.forEach((enemy, i) => {
            // 檢查碰撞
            if (RectCollision(enemy.instance.cube.position, player.instance.cube.position)) {
                gameActions(GameStatus.GameOver);
                return;
            }
        });

    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);

}

// 2D 矩形碰撞檢測
function RectCollision(r1, r2) {
    // 這邊因為(X,Y)在方塊中心
    // 所以在取得min、max時，要 +/- width/2
    // Rect1
    var minX1 = r1.x - boxSize / 2,
        maxX1 = r1.x + boxSize / 2,
        minZ1 = r1.z - boxSize / 2,
        maxZ1 = r1.z + boxSize / 2;
    // Rect2
    var minX2 = r2.x - boxSize / 2,
        maxX2 = r2.x + boxSize / 2,
        minZ2 = r2.z - boxSize / 2,
        maxZ2 = r2.z + boxSize / 2;

    if (maxX1 > minX2 && maxX2 > minX1 &&
        maxZ1 > minZ2 && maxZ2 > minZ1) {
        return true;
    } else
        return false;
}

// Init Window
function setDifficult() {
    var difficultChoose = $("#difficultChoose");

    switch (difficultChoose.val()) {
        case '容易':
            enemyCount = 4;
            scroe_magnification = 1;
            difficult = normal_difficult;
            break;
        case '一般':
            enemyCount = 7;
            scroe_magnification = 2;
            difficult = normal_difficult;
            break;
        case '困難':
            enemyCount = 10;
            scroe_magnification = 5;
            difficult = hard_difficult;
            break;
        case '地獄':
            enemyCount = 13;
            scroe_magnification = 10;
            difficult = dante_difficult;
            break;
        default:
            enemyCount = 0;
            break;
    }
}

function resetGame() {
    gameActions(GameStatus.Ready);
    // clear scene
    $("#labels div").remove();

    while (objects.length > 1) {
        objects.forEach((e, idx, self) => {
            if (e != plane) {
                scene.remove(e);
                self.splice(idx, 1);
            }
        });
    }
    setDifficult();

    parameters(enemyCount, difficult, true);
    GenerateGameLevel();
}

$("#difficultChoose").on('change', function () {
    resetGame();
});

// 初始化
parameters(0, 0.5, true);
basicSceneInit();
GenerateGameLevel();
initFirebase();
getTopBoard();