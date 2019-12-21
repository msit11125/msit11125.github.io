var container = document.getElementById("container");
var camera, scene, renderer;

var plane;
var mouse,
    raycaster;

var cubeGeo, cubeMaterial;
var objects = [];
var paths = [];
var pathIdxs = [];

var cubes = [];

var stats;

const boxSize = 1;
var groundSize = 30;

var bound = groundSize / 2 - boxSize / 2;
var randBlockCount = 150;
var moveSpeed = 2;

var theMatrix = newMatrix();

var enemies = [],
    player;
var enemyCount = 4;

var enemies_position_default = [];

var player_position_default = {};

var isGameStart = false;
var isGameOver = true;
var score = 0; // 遊戲得分
var difficult = 0.5; // 遊戲難度 (愈低愈難)

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000);

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        24000
    );

    camera.position.set(0, 15, 5);

    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.setClearColor(new THREE.Color(0x00000, 1.0));
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // defaults init
    for (var i = 0; i < enemyCount; i++) {
        enemies_position_default.push(new THREE.Vector3(0, boxSize / 2, 0));
        pathIdxs.push(0);
    }
    player_position_default = new THREE.Vector3(0, boxSize / 2, 0);

    // cubes
    cubeGeo = new THREE.BoxBufferGeometry(boxSize, boxSize, boxSize);
    cubeMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff
    });

    // grid
    var gridHelper = new THREE.GridHelper(groundSize, groundSize / boxSize, 0xb3b3b3, 0xb3b3b3);
    scene.add(gridHelper);

    // plane
    var geometry = new THREE.PlaneBufferGeometry(groundSize, groundSize);
    geometry.rotateX(-Math.PI / 2);

    plane = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
            //visible: false,
            transparent: true,
            opacity: 0.8,
            color: 0x28666D,
            side: THREE.DoubleSide
        }),
    );
    plane.receiveShadow = true;
    scene.add(plane);
    objects.push(plane);


    // raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();


    // skybox
    addSkyBox(scene);

    // 敵人座標
    for (var i = 0; i < enemyCount; i++) {
        var geo = new THREE.BoxBufferGeometry(boxSize * 0.8, boxSize, boxSize* 0.8);
        var enemy = makeInstance(scene, geo, 0xFFE364, 0, '敵人' + (i + 1), true);
        enemy.cube.position.copy(new THREE.Vector3(0, boxSize / 2 , 0));
        enemy.cube.castShadow = true;
        cubes.push(enemy);
        objects.push(enemy.cube);
        scene.add(enemy.cube);

        enemies.push(enemy);
    }
    // 玩家座標
    player = makeInstance(scene, cubeGeo, 0xD11141, 0, '', false);
    player.cube.position.copy(new THREE.Vector3(0, boxSize / 2, 0));
    player.cube.add(camera);
    cubes.push(player);
    objects.push(player.cube);
    scene.add(player.cube);

    // lights
    var ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 0.75, 0.5).normalize();
    scene.add(directionalLight);

    initEvents(camera, renderer);
    initMoveEvent(player, bound);

    // stats 
    stats = initStats();


    container.appendChild(renderer.domElement);
    // render
    requestAnimationFrame(render);


}



// -----------------------------------------------------
// --------------------- Game 相關 ---------------------
// -----------------------------------------------------


var gameText = $(".gameText");
var startGameButton = $("#startGame");
var scoreBoard = $("#scoreBoard");

// 開始遊戲
startGameButton.click(function (e) {
    if (isGameStart && !isGameOver) {
        gameState("pause");
    } else {
        gameState("start");
    }
});

// 關卡生成
function GenerateGameLevel() {
    let voxels = [];

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max + 1)) + min;
    };

    function standardization(num) {
        return Math.ceil(num / boxSize) * boxSize + (boxSize / 2);
    }

    function goPlayerEnemiesRandom() {
        for (var i = 0; i < enemyCount; i++) {
            enemies[i].cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2));
            enemies[i].cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2));
            enemies_position_default[i].x = enemies[i].cube.position.x;
            enemies_position_default[i].z = enemies[i].cube.position.z;
            enemies[i].position = enemies_position_default[i].clone();
        }

        player.cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2));
        player.cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2));

        player_position_default.x = player.cube.position.x;
        player_position_default.z = player.cube.position.z;
        player.position = player_position_default.clone();
        // 避免重疊
        enemies_position_default.forEach((e_pos) => {
            if (e_pos.x == player_position_default.x &&
                e_pos.z == player_position_default.z) {
                goPlayerEnemiesRandom();
                return;
            }
        });

    }

    function goBlockRandom() {

        for (var i = 0; i < randBlockCount; i++) {
            // 增加障礙物
            let voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
            let voxelX = standardization(getRandom(-bound - boxSize, bound * 2));
            let voxelZ = standardization(getRandom(-bound - boxSize, bound * 2));
            // 避免重疊 TODO


            voxel.position.copy({
                x: voxelX,
                y: boxSize / 2,
                z: voxelZ
            });

            let blockPoint = xzToPoint(voxel.position.x, voxel.position.z);
            // 不重疊方塊
            if (theMatrix[blockPoint.row][blockPoint.col] != 1) {
                // 加入方塊
                theMatrix[blockPoint.row][blockPoint.col] = 1;
                voxels.push(voxel);
            }
        }
    }

    function createBoundWall() {
        for (var direction = 1; direction <= 4; direction++) {
            var wallLen = bound * 2 + 1;

            // 增加牆壁
            wallGeo = new THREE.BoxBufferGeometry(wallLen, boxSize, 0.01);
            wallMaterial = new THREE.MeshLambertMaterial({
                color: 0xE8E8E8
            });

            let voxel = new THREE.Mesh(wallGeo, wallMaterial);
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

    goPlayerEnemiesRandom();
    goBlockRandom();

    paths = findPath();
    paths.forEach((path) => {

        if (path.length === 0) {
            gameText.text("找不到路徑！");
            gameText.show();
            return;
        }
    });

    createBoundWall();

    // Create
    levelGenerateTimes = 0;
    voxels.forEach((voxel) => {
        scene.add(voxel);
        objects.push(voxel);
    });
};

function findPath() {
    var paths = [];
    enemies.forEach((enemy, i) => {
        var grid = new PF.Grid(Object.assign(theMatrix));
        var finder = new PF.AStarFinder();

        const enemyPoint = xzToPoint(enemy.position.x, enemy.position.z);
        const playerPoint = xzToPoint(player.position.x, player.position.z);

        var path_array = finder.findPath(enemyPoint.col, enemyPoint.row, playerPoint.col, playerPoint.row, grid);

        paths.push(path_array);
    });

    return paths;
}

function gameState(state) {
    // pause
    if (state == "pause") {
        gameText.text("Pause");
        gameText.show();
        pathIdxs.forEach((pathIdx, i) => {
            pathIdxs[i] = 1;
        });

        startGameButton.text("繼續遊戲");

        isGameStart = false;
    }

    // start
    if (state == "start") {
        if (isGameOver) {
            score = 0;
            difficult = 0.5;
            
            enemies.forEach((enemy, i) => {
                enemy.cube.position.copy(enemies_position_default[i]);
                enemy.position.copy(enemies_position_default[i]);
            });
            player.cube.position.copy(player_position_default);
            player.position.copy(player_position_default);
        }

        // path finding logic
        paths = findPath();

        gameText.hide();
        startGameButton.text("暫停");

        isGameOver = false;
        isGameStart = true;
    }

    // game over
    if (state == "gameover") {
        gameText.text("Game Over");
        gameText.show();

        startGameButton.text("重新開始");

        isGameStart = false;
        isGameOver = true;
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


var clock = new THREE.Clock();
var delta = 0;

function render() {

    // 遊戲已開始
    if (isGameStart) {
        delta += clock.getDelta();

        if (delta > difficult) {
           
            enemies.forEach((enemy, i) => {
                let rndTime = 1; //Math.random();
                
                setTimeout(()=> {
                    let coords = enemy.cube.position; // init vector3

                    var pathIdx = pathIdxs[i];
                    var path = paths[i];
    
                    if (pathIdx < path.length) {
                        var element = path[pathIdx];
    
    
                        // -- 面對方向改變 --
                        // 上個位置
                        var p1 = {
                            x: coords.x,
                            z: coords.z
                        };
                        // 下個位置
                        var p2 = {
                            x: element[0] * boxSize - bound,
                            z: element[1] * boxSize - bound
                        }
    
                        // -- 移動改變 --
                        let v = coords;
                        let vTo = new THREE.Vector3(p2.x, coords.y, p2.z);
                        enemy.position.x = vTo.x;
                        enemy.position.z = vTo.z;
                        new TWEEN.Tween(v)
                            .to(vTo, 1000)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .onUpdate(() => {})
                            .onComplete(() => {
    
                            })
                            .start();
    
    
                        var angleRadians = caculateVectorRotation(p1, p2);
                        enemy.cube.rotation.y = -angleRadians;
    
                        pathIdxs[i] += 1;
                        
                    }

                }, 1000 * rndTime )
                
            });

            score += 1;
            if (score % 10 == 0) {
                difficult *= 0.95;
            }
            scoreBoard.text(score)
            delta = 0;
        }
    }



    camera.lookAt(player.cube.position.x, player.cube.position.y, player.cube.position.z);
    stats.update();
    TWEEN.update();

    // 更新 startPoint以及endPoint
    cubes.forEach((cubeInfo, ndx) => {
        const {
            cube,
            elem
        } = cubeInfo;
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


    renderer.render(scene, camera);

    requestAnimationFrame(render);

    if (isGameStart) {

        enemies.forEach((enemy, i) => {
            if (enemy.cube.position.x == player.cube.position.x &&
                enemy.cube.position.z == player.cube.position.z) {

                gameState("gameover");
                return;
            }
        })
    }
}



// Init Window
init();

GenerateGameLevel();