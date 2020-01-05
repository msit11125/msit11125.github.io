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
    cube.castShadow = true;
    cube.receiveShadow = true;

    cube.position.x = x;

    scene.add(cube);

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


function makeTextSprite(message, opts) {
    var parameters = opts || {};
    var fontface = parameters.fontface || 'Helvetica';
    var fontsize = parameters.fontsize || 120;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = fontsize + "px " + fontface;

    // get size data (height depends only on font size)
    var metrics = context.measureText(message);
    var textWidth = metrics.width;

    // text color
    context.fillStyle = 'rgba(255, 255, 0, 1.0)';
    context.fillText(message, 0, fontsize);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas)
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({
        map: texture
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1.0);
    sprite.center.set(0, 1);
    return sprite;
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}