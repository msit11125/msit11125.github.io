function addSkyBox(scene, theme) {

    if(theme == 1){
        scene.add(makeSkyBoxTheme1());
    }

    if(theme == 2){
        scene.add(makeSkyBoxTheme2());
    }
   
}

function makeSkyBoxTheme1(){
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

    return skybox;
}


function makeSkyBoxTheme2(){
    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load(
        "/assets/texture/plants/posx.jpg"
    );
    let texture_bk = new THREE.TextureLoader().load(
        "/assets/texture/plants/negx.jpg"
    );
    let texture_up = new THREE.TextureLoader().load(
        "/assets/texture/plants/posy.jpg"
    );
    let texture_dn = new THREE.TextureLoader().load(
        "/assets/texture/plants/negy.jpg"
    );
    let texture_lf = new THREE.TextureLoader().load(
        "/assets/texture/plants/negz.jpg"
    );
    let texture_rt = new THREE.TextureLoader().load(
        "/assets/texture/plants/posz.jpg"
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

    return skybox;
}