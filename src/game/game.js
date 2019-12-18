
var container = document.getElementById("container");
var camera, scene, renderer;
var orbitControls;
var plane;
var mouse,
    raycaster;

var rollOverMesh, rollOverMaterial;
var cubeGeo, cubeMaterial;
var objects = [];
var path = [];
var cubes = [];

var pointlight_startPos;
var pointlight_endPos;

var controls; // dat.gui
var stats;


const boxSize = 1;
var groundSize = 10;

var bound = groundSize / 2 - boxSize / 2;
var randBlockCount = 30;
var moveSpeed = 2;

var theMatrix = newMatrix();

var enemy, player;
var enemyPos_default = {
    x: -bound,
    y: boxSize / 2,
    z: -bound
};
var playerPos_default = {
    x: bound,
    y: boxSize / 2,
    z: bound
};

var isMousePress = false;
var isSetTimouts = [];
var isGameStart = false;
var isGameOver = true;

function init() {
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        24000
    );
    camera.position.set(0, groundSize * 1.4, 0);
    camera.lookAt(0, 0, 0);

    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.setClearColor(new THREE.Color(0x00000, 1.0));
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000);



    // roll-over helpers
    var rollOverGeo = new THREE.BoxBufferGeometry(boxSize, boxSize, boxSize);
    rollOverMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.5,
        transparent: true
    });
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    scene.add(rollOverMesh);

    // cubes
    cubeGeo = new THREE.BoxBufferGeometry(boxSize, boxSize, boxSize);
    cubeMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff
    });

    // grid
    var gridHelper = new THREE.GridHelper(groundSize, groundSize / boxSize, 0xb3b3b3, 0xb3b3b3);
    scene.add(gridHelper);

    const planeSize = groundSize;

    const loader = new THREE.TextureLoader();
    const texture = loader.load(
        "/assets/texture/chess.png"
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / boxSize / 2;
    texture.repeat.set(repeats, repeats);

    // plane
    var geometry = new THREE.PlaneBufferGeometry(groundSize, groundSize);
    geometry.rotateX(-Math.PI / 2);

    plane = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
            //visible: false
            transparent: true,
            opacity: 0.3,
            map: texture,
            color: 0xc0c0c0,
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
    enemy = makeInstance(scene, cubeGeo, 0xFFE364, 0, '玩家', true);
    enemy.cube.position.copy(enemyPos_default);
    enemy.cube.castShadow = true;
    cubes.push(enemy);
    objects.push(enemy.cube);
    scene.add(enemy.cube);

    // 玩家座標
    player = makeInstance(scene, cubeGeo, 0x00f7fc, 0, '目標', false);
    player.cube.position.copy(playerPos_default);
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

    // stats 
    stats = initStats();

    orbitControls = initOrbitControls();
    // gui control panel
    controls = initguiControl(rollOverMesh);

    

    container.appendChild(renderer.domElement);
    // render
    requestAnimationFrame(render);

    setTimeout(
        () => {
            $('#overlay').fadeOut();
        }, 1000
    )


}



// -----------------------------------------------------
// --------------------- Game 相關 ---------------------
// -----------------------------------------------------


// 目標導航
$("#startGame").click(function (e) {
    if (isGameStart) {
        gameState(0);
    } else {
        GenerateGameLevel();
        gameState(1);
    }
});

// 重設遊戲
$("#resetGame").click(function () {
    gameState(2);

});

// 關卡生成
function GenerateGameLevel() {
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max + 1)) + min;
    };

    function standardization(num) {
        return Math.ceil(num / boxSize) * boxSize + (boxSize / 2);
    }

    function goStartEndRandom() {
        enemy.cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2));
        enemy.cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2));

        player.cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2));
        player.cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2));

        enemyPos_default.x = enemy.cube.position.x;
        enemyPos_default.z = enemy.cube.position.z;
        playerPos_default.x = player.cube.position.x;
        playerPos_default.z = player.cube.position.z;

        // 避免重疊
        if (enemyPos_default.x == playerPos_default.x &&
            enemyPos_default.z == playerPos_default.z) {
            goStartEndRandom();
        }
    }

    function goBlockRandom() {
        let randBlockCount = controls.randBlockCount;

        for (var i = 0; i < randBlockCount; i++) {
            // 增加障礙物
            let voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
            let voxelX = standardization(getRandom(-bound - boxSize, bound * 2));
            let voxelZ = standardization(getRandom(-bound - boxSize, bound * 2));
            // 避免重疊
            while ((voxelX == enemyPos_default.x &&
                    voxelZ == enemyPos_default.z) ||
                (voxelX == playerPos_default.x &&
                    voxelZ == playerPos_default.z)) {
                voxelX = standardization(getRandom(-bound - boxSize, bound * 2));
                voxelZ = standardization(getRandom(-bound - boxSize, bound * 2));
            }
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
                scene.add(voxel);
                objects.push(voxel);
            }

        }

    }

    gameState(2);
    goStartEndRandom();
    goBlockRandom();

};



function clearNextMovingStep() {
    isSetTimouts.forEach(e => {
        clearTimeout(e);
    });
    isSetTimouts = [];
}

function xzToPoint(x, z) {
    var col = (x + bound) / boxSize;
    var row = (z + bound) / boxSize;
    return {
        col: col,
        row: row
    };
}

function gameState(state) {
    var gameText = $(".gameText");
    var button = $("#startGame");

    if(!controls.openOrbitControls)  rollOverMesh.visible = true;

    // stop
    if (state == 0) {
        gameText.text("Pause");
        gameText.show();
        clearNextMovingStep();
        button.text("目標導航");

        isGameStart = false;
    }

    // start
    if (state == 1) {
        if (isGameOver) {
            enemy.cube.position.copy(enemyPos_default);
            player.cube.position.copy(playerPos_default);
        }

        // path finding logic
        var grid = new PF.Grid(theMatrix);
        var finder = new PF.AStarFinder();
        var startPoint = xzToPoint(enemy.cube.position.x, enemy.cube.position.z);
        var endPoint = xzToPoint(player.cube.position.x, player.cube.position.z);
        path = finder.findPath(startPoint.col, startPoint.row, endPoint.col, endPoint.row, grid);

        if (path.length === 0) {
            gameText.text("找不到路徑！");
            gameText.show();
            return;
        }
        
        rollOverMesh.visible = false;
        let coords = enemy.cube.position; // init vector3

        path.forEach((element, idx) => {
            // 上個位置
            let vectorA = coords;

            // 間隔動畫
            isSetTimouts.push(
                setTimeout(function () {
                    // -- 移動改變 --
                    let tween = new TWEEN.Tween(coords)
                        .to({
                            x: element[0] * boxSize - bound,
                            z: element[1] * boxSize - bound
                        }, 1000 * 1 / controls.moveSpeed)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(() => {
                            
                        }).start();

                    // -- 面對方向改變 --

                    // 新的位置
                    var vectorB = coords;
                    vectorA = vectorB;

                    var p1 = {
                        x: vectorA.x,
                        z: vectorA.z
                    };

                    var p2 = {
                        x: element[0] * boxSize - bound,
                        z: element[1] * boxSize - bound
                    }

                    var angleRadians = caculateVectorRotation(p1, p2);

                    enemy.cube.rotation.y = -angleRadians;

                    // 走過的路徑
                    const texture = new THREE.TextureLoader().load(
                        "/assets/texture/yellow.JPG"
                    );
                    var pathPointGeo = new THREE.ConeGeometry(boxSize / 3, boxSize / 3, 10);
                    var pathPointMesh = new THREE.Mesh(
                        pathPointGeo,
                        new THREE.MeshBasicMaterial({
                            map: texture,
                            side: THREE.DoubleSide
                        }),
                    );
                    pathPointMesh.position.set(vectorA.x, boxSize / 3 / 2, vectorA.z);

                    scene.add(pathPointMesh);
                    objects.push(pathPointMesh)
                }, 1000 * idx * 1 / controls.moveSpeed)
            );


        });

        gameText.hide();
        button.text("暫停");

        isGameOver = false;
        isGameStart = true;
    }

    // restart
    if (state == 2) {
        button.text("目標導航");
        gameText.hide();
        clearNextMovingStep();

        // 這裡刪除會有問題，因此加while
        while (objects.length > 3) {
            objects.forEach((e, idx, self) => {
                if (e != plane && e != enemy.cube && e != player.cube) {
                    scene.remove(e);
                    self.splice(idx, 1);
                }
            });
        }
        theMatrix = newMatrix();

        enemyPos_default = {
            x: -bound,
            y: boxSize / 2,
            z: -bound
        };
        playerPos_default = {
            x: bound,
            y: boxSize / 2,
            z: bound
        };
        enemy.cube.position.copy(enemyPos_default);
        player.cube.position.copy(playerPos_default);

        enemy.cube.rotation.y = 0;

        isGameStart = false;
    }

    // game over
    if (state == 3) {
        gameText.text("Game Over");
        gameText.show();

        button.text("目標導航");

        isGameStart = false;
        isGameOver = true;
    }

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
    delta += clock.getDelta();
    if(delta > 2){
        delta = 0;
        
    }
    camera.position.set(player.cube.position.x, player.cube.position.y + 10, player.cube.position.z);
    
    orbitControls.enabled = controls.openOrbitControls;

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


    if (isGameStart &&
        enemy.cube.position.x == player.cube.position.x &&
        enemy.cube.position.z == player.cube.position.z) {
        gameState(3);
    }
}



// Init Window
init();
