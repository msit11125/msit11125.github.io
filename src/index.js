var container = document.getElementById("container");
var camera, scene, renderer;
var orbitControls;
var plane;
var mouse,
    raycaster,
    isShiftDown = false;
var rollOverMesh, rollOverMaterial;
var cubeGeo, cubeMaterial;
var objects = [];
var path = [];
var cubes = [];

var pointlight_startPos;
var pointlight_endPos;

var controls; // dat.gui
var stats;


const boxSize = 50;
var groundSize = localStorage.getItem("groundSize") ? parseInt(localStorage.getItem("groundSize")) : 1000;

var bound = groundSize / 2 - boxSize / 2;

var theMatrix = newMatrix();

var startPos, endPos;
var startCubPos_default = {
    x: -bound,
    y: 25,
    z: -bound
};
var endCubePos_default = {
    x: bound,
    y: 25,
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
        20000
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
    startPos = makeInstance(cubeGeo, 0x0ff74c, 0, '物件');
    startPos.cube.position.copy(startCubPos_default);
    startPos.cube.castShadow = true;
    cubes.push(startPos);
    objects.push(startPos.cube);
    scene.add(startPos.cube);

    // 目標座標
    endPos = makeInstance(cubeGeo, 0x00f7fc, 0, '目標');
    endPos.cube.position.copy(endCubePos_default);
    cubes.push(endPos);
    objects.push(endPos.cube);
    scene.add(endPos.cube);

    // lights
    pointlight_startPos = new THREE.PointLight(0x0ff74c, 10, 100);
    pointlight_startPos.position.y = pointlight_startPos.position.y;

    pointlight_endPos = new THREE.PointLight(0x00f7fc, 10, 100);     
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
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("keyup", onDocumentKeyUp, false);
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
        this.randBlockCount = 50;
        this.groundSize = groundSize;
    };

    var gui = new dat.GUI();
    var groundResize = gui.add(controls, 'groundSize', 500, 3000, 100).name('地圖大小');
    gui.add(controls, 'randBlockCount', 1, 1500, 10).name('阻礙物數量');
    gui.add(controls, 'openOrbitControls').name('移動攝影機');


    groundResize.onFinishChange(function (value) {
        localStorage.setItem("groundSize", controls.groundSize);
        location.reload();
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
    pointlight_endPos.position.copy( endPos.cube.position);

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
        rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
        rollOverMesh.position
            .divideScalar(boxSize)
            .floor()
            .multiplyScalar(boxSize)
            .addScalar(25);
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

        if (isShiftDown || event.which == 3) {
            // 消除障礙物
            if (intersect.object !== plane) {
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object), 1);

                var blockPoint = xzToPoint(intersect.object.position.x, intersect.object.position.z);
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
                .addScalar(25);

            var blockPoint = xzToPoint(voxel.position.x, voxel.position.z);

            console.log("擺放點:", voxel.position, blockPoint);
            theMatrix[blockPoint.row][blockPoint.col] = 1;

            if (voxel.position.y == boxSize / 2) {
                scene.add(voxel);
                objects.push(voxel);
            }
        }
    }
}

function onDocumentKeyDown(event) {

    switch (event.keyCode) {
        case 16:
            isShiftDown = true;
            break;
    }
}

function onDocumentKeyUp(event) {
    switch (event.keyCode) {
        case 16:
            isShiftDown = false;
            break;
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
        return Math.floor(Math.random() * max) + min;
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
                y: 25,
                z: voxelZ
            });

            let blockPoint = xzToPoint(voxel.position.x, voxel.position.z);
            theMatrix[blockPoint.row][blockPoint.col] = 1;
            scene.add(voxel);
            objects.push(voxel);
        }

    }

    gameState(2);
    goStartEndRandom();
    goBlockRandom();

});



function makeInstance(geometry, color, x, name) {
    const labelContainerElem = document.querySelector('#labels');

    const material = new THREE.MeshPhongMaterial({
        color
    });

    const cube = new THREE.Mesh(geometry, material);
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
        let coords = startPos.cube.position;
        path.forEach((element, idx) => {
            // 移動
            isSetTimouts.push(
                setTimeout(function () {
                    let tween = new TWEEN.Tween(coords)
                        .to({
                            x: element[0] * boxSize - bound,
                            z: element[1] * boxSize - bound
                        }, 200)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(() => {
                            startPos.cube.position.x = coords.x;
                            startPos.cube.position.y = coords.y;
                            startPos.cube.position.z = coords.z;
                        }).start();
                }, 200 * idx)
            )
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
            y: 25,
            z: -bound
        };
        endCubePos_default = {
            x: bound,
            y: 25,
            z: bound
        };
        startPos.cube.position.copy(startCubPos_default);
        endPos.cube.position.copy(endCubePos_default);

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