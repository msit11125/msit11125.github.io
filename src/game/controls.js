
function initStats() {
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '';
    stats.domElement.style.top = '';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.right = '0px';
    document.getElementById("Stats-output").appendChild(stats.domElement);
    return stats;
}
