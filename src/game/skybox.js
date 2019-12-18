function addSkyBox(scene) {
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
