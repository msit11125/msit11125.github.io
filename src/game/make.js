function makeInstance(scene, geometry, color, x, name, hasFace = false) {
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

    const position = cube.position.clone();

    return {
        position,
        cube,
        elem
    };
}

function makeSound(listener, src, volume = 0.2) {
    // create a global audio source
    var sound = new THREE.Audio(listener);
    
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load(src, function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(volume);
        sound.play();
    });

}