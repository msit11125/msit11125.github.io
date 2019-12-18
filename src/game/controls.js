
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

function initOrbitControls(){
  // OrbitControls
  var orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControls.target.set(0, 0, 0);
  orbitControls.enabled = false;

  return orbitControls;
}

function initguiControl (rollOverMesh){
    
    var controls = new function () {
        this.openOrbitControls = false;
        this.randBlockCount = randBlockCount;
        this.moveSpeed = moveSpeed;
    };

    var gui = new dat.GUI();
    gui.add(controls, 'randBlockCount', 1, 2000, 20).name('阻礙物數量');
    gui.add(controls, 'moveSpeed', 1, 10, 1).name('移動速度');
    var orbitCamera = gui.add(controls, 'openOrbitControls').name('移動攝影機');

    orbitCamera.onFinishChange(function (value) {
        if(controls.openOrbitControls){
            rollOverMesh.visible = false;
        }else{
            rollOverMesh.visible = true;
        }
    });

    return controls;
}