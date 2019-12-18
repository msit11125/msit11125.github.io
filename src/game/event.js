function initEvents(camera, renderer) {

    // auto resize
    window.addEventListener("resize", onWindowResize, false);

    document.addEventListener('contextmenu', event => event.preventDefault());


    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

}