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
var groundSize = localStorage.getItem("groundSize") ? parseInt(localStorage.getItem("groundSize")) : 10;

var bound = groundSize / 2 - boxSize / 2;
var randBlockCount = 30;
var moveSpeed = 2;

var theMatrix = newMatrix();

var startPos, endPos;
var startCubPos_default = {
    x: -bound,
    y: boxSize / 2,
    z: -bound
};
var endCubePos_default = {
    x: bound,
    y: boxSize / 2,
    z: bound
};

var isMousePress = false;
var isSetTimouts = [];
var isGameStart = false;
var isGameOver = true;

init();

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
    addSkyBox();

    // 物件座標
    startPos = makeInstance(cubeGeo, 0xFFE364, 0, '玩家', true);
    startPos.cube.position.copy(startCubPos_default);
    startPos.cube.castShadow = true;
    cubes.push(startPos);
    objects.push(startPos.cube);
    scene.add(startPos.cube);

    // 目標座標
    endPos = makeInstance(cubeGeo, 0x00f7fc, 0, '目標', false);
    endPos.cube.position.copy(endCubePos_default);
    cubes.push(endPos);
    objects.push(endPos.cube);
    scene.add(endPos.cube);

    // lights
    pointlight_startPos = new THREE.PointLight(0xFFE364, 1, 2);
    pointlight_startPos.position.y = pointlight_startPos.position.y;

    pointlight_endPos = new THREE.PointLight(0x00f7fc, 1, 2);
    pointlight_endPos.position.y = pointlight_endPos.position.y;

    scene.add(pointlight_startPos);
    scene.add(pointlight_endPos);

    var ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 0.75, 0.5).normalize();
    scene.add(directionalLight);

    document.addEventListener("mousemove", onDocumentMouseMove, false);
    document.addEventListener("mousedown", onDocumentMouseDown, false);
    document.addEventListener("mouseup", function () {
        isMousePress = false;
    }, false);
    document.addEventListener('contextmenu', event => event.preventDefault());


    // stats 
    stats = initStats();

    // OrbitControls
    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.target.set(0, 0, 0);
    orbitControls.enabled = false;

    // gui control panel
    controls = new function () {
        this.openOrbitControls = false;
        this.randBlockCount = randBlockCount;
        this.groundSize = groundSize;
        this.moveSpeed = moveSpeed;
    };

    var gui = new dat.GUI();
    var groundResize = gui.add(controls, 'groundSize', 4, 200, 2).name('地圖大小');
    gui.add(controls, 'randBlockCount', 1, 2000, 20).name('阻礙物數量');
    gui.add(controls, 'moveSpeed', 1, 10, 1).name('移動速度');
    var orbitCamera = gui.add(controls, 'openOrbitControls').name('移動攝影機');


    groundResize.onFinishChange(function (value) {
        localStorage.setItem("groundSize", controls.groundSize);
        location.reload();
    });
    orbitCamera.onFinishChange(function (value) {
        if (controls.openOrbitControls) {
            rollOverMesh.visible = false;
        } else {
            rollOverMesh.visible = true;
        }
    });

    // auto resize
    window.addEventListener("resize", onWindowResize, false);


    container.appendChild(renderer.domElement);
    // render
    requestAnimationFrame(render);

    setTimeout(
        () => {
            $('#overlay').fadeOut();
        }, 1000
    )


}

function addSkyBox() {
    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load(
        "/assets/texture/blue/bkg1_front.png"
    );
    let texture_bk = new THREE.TextureLoader().load(
        "/assets/texture/blue/bkg1_back.png"
    );
    let texture_up = new THREE.TextureLoader().load(
        "/assets/texture/blue/bkg1_top.png"
    );
    let texture_dn = new THREE.TextureLoader().load(
        "/assets/texture/blue/bkg1_bot.png"
    );
    let texture_lf = new THREE.TextureLoader().load(
        "/assets/texture/blue/bkg1_left.png"
    );
    let texture_rt = new THREE.TextureLoader().load(
        "/assets/texture/blue/bkg1_right.png"
    );

    materialArray.push(new THREE.MeshBasicMaterial({
        map: texture_ft
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: texture_bk
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: texture_up
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: texture_dn
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: texture_lf
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: texture_rt
    }));

    for (let i = 0; i < 6; i++) materialArray[i].side = THREE.DoubleSide;
    let skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
    let skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);
}

function initStats() {
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '';
    stats.domElement.style.bottom = '0px';
    document.getElementById("Stats-output").appendChild(stats.domElement);
    return stats;
}




function render() {

    orbitControls.enabled = controls.openOrbitControls;

    stats.update();

    TWEEN.update();
    pointlight_startPos.position.copy(startPos.cube.position);
    pointlight_endPos.position.copy(endPos.cube.position);

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
        startPos.cube.position.x == endPos.cube.position.x &&
        startPos.cube.position.z == endPos.cube.position.z) {
        gameState(3);
    }
}









// -----------------------------------------------------
// --------------------- Game 相關 ---------------------
// -----------------------------------------------------

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        var intersect = intersects[0];
        intersect.point.y = -boxSize / 2; // y軸固定

        rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);

        rollOverMesh.position
            .divideScalar(boxSize)
            .floor()
            .multiplyScalar(boxSize)
            .addScalar(boxSize / 2);

    }

    if (isMousePress) {
        onDocumentMouseDown(event);
    }
}

function onDocumentMouseDown(event) {
    if (controls.openOrbitControls || isGameStart) {
        return;
    }
    isMousePress = true;

    event.preventDefault();
    mouse.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        var intersect = intersects[0];

        intersect.point.y = -boxSize / 2; // y軸固定
        // 滑鼠右鍵消除方塊
        if (event.which == 3) {

            // 消除障礙物
            if (intersect.object !== plane) {
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object), 1);

                let blockPoint = xzToPoint(intersect.object.position.x, intersect.object.position.z);
                theMatrix[blockPoint.row][blockPoint.col] = 0;
            }

        } else {
            // 增加障礙物
            var voxel = new THREE.Mesh(cubeGeo, cubeMaterial);

            voxel.position.copy(intersect.point).add(intersect.face.normal);
            voxel.position
                .divideScalar(boxSize)
                .floor()
                .multiplyScalar(boxSize)
                .addScalar(boxSize / 2);

            let blockPoint = xzToPoint(voxel.position.x, voxel.position.z);

            console.log("擺放點:", voxel.position, blockPoint, theMatrix[blockPoint.row][blockPoint.col]);

            // 判斷已經擺放
            if (theMatrix[blockPoint.row][blockPoint.col] == 1) {
                return;
            }

            voxel.position.y = Math.abs(voxel.position.y);

            if (voxel.position.y == boxSize / 2) {
                theMatrix[blockPoint.row][blockPoint.col] = 1;
                scene.add(voxel);
                objects.push(voxel);
            }
        }
    }
}


// 目標導航
$("#startGame").click(function (e) {
    if (isGameStart) {
        gameState(0);
    } else {
        gameState(1);
    }
});

// 重設遊戲
$("#resetGame").click(function () {
    gameState(2);

});

// 隨機
$("#random").click(function (e) {
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max + 1)) + min;
    };

    function standardization(num) {
        return Math.ceil(num / boxSize) * boxSize + (boxSize / 2);
    }

    function goStartEndRandom() {
        startPos.cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2));
        startPos.cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2));

        endPos.cube.position.x = standardization(getRandom(-bound - boxSize, bound * 2));
        endPos.cube.position.z = standardization(getRandom(-bound - boxSize, bound * 2));

        startCubPos_default.x = startPos.cube.position.x;
        startCubPos_default.z = startPos.cube.position.z;
        endCubePos_default.x = endPos.cube.position.x;
        endCubePos_default.z = endPos.cube.position.z;

        // 避免重疊
        if (startCubPos_default.x == endCubePos_default.x &&
            startCubPos_default.z == endCubePos_default.z) {
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
            while ((voxelX == startCubPos_default.x &&
                    voxelZ == startCubPos_default.z) ||
                (voxelX == endCubePos_default.x &&
                    voxelZ == endCubePos_default.z)) {
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
                    voxel.rotateY(90 * Math.PI /180)
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
                    voxel.rotateY(90 * Math.PI /180)
                    break;
            }       
            scene.add(voxel);
            objects.push(voxel);
        }
    }

    gameState(2);
    goStartEndRandom();
    goBlockRandom();

    createBoundWall();

});



function makeInstance(geometry, color, x, name, hasFace = false) {
    const labelContainerElem = document.querySelector('#labels');

    const texture = new THREE.TextureLoader().load(
        "/assets/texture/face.PNG"
    );

    var materials;

    if (hasFace) {
        materials = [
            new THREE.MeshLambertMaterial({
                color: color
            }),
            new THREE.MeshLambertMaterial({
                color: color
            }),
            new THREE.MeshLambertMaterial({
                map: texture
            }),
            new THREE.MeshLambertMaterial({
                color: color
            }),
            new THREE.MeshLambertMaterial({
                color: color
            }),
            new THREE.MeshLambertMaterial({
                color: color
            })
        ];
    } else {
        materials = new THREE.MeshLambertMaterial({
            color: color
        });
    }

    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    cube.position.x = x;

    const elem = document.createElement('div');
    elem.textContent = name;
    labelContainerElem.appendChild(elem);

    return {
        cube,
        elem
    };
}

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

    if (!controls.openOrbitControls) rollOverMesh.visible = true;

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
            startPos.cube.position.copy(startCubPos_default);
            endPos.cube.position.copy(endCubePos_default);
        }

        // path finding logic
        var grid = new PF.Grid(theMatrix);
        var finder = new PF.AStarFinder();
        var startPoint = xzToPoint(startPos.cube.position.x, startPos.cube.position.z);
        var endPoint = xzToPoint(endPos.cube.position.x, endPos.cube.position.z);
        path = finder.findPath(startPoint.col, startPoint.row, endPoint.col, endPoint.row, grid);

        if (path.length === 0) {
            gameText.text("找不到路徑！");
            gameText.show();
            return;
        }

        rollOverMesh.visible = false;
        let coords = startPos.cube.position; // init vector3

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

                    startPos.cube.rotation.y = -angleRadians;

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
                if (e != plane && e != startPos.cube && e != endPos.cube) {
                    scene.remove(e);
                    self.splice(idx, 1);
                }
            });
        }
        theMatrix = newMatrix();

        startCubPos_default = {
            x: -bound,
            y: boxSize / 2,
            z: -bound
        };
        endCubePos_default = {
            x: bound,
            y: boxSize / 2,
            z: bound
        };
        startPos.cube.position.copy(startCubPos_default);
        endPos.cube.position.copy(endCubePos_default);

        startPos.cube.rotation.y = 0;

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