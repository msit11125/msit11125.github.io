

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

    return {
        cube,
        elem
    };
}