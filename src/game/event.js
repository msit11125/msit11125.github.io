function initEvents(camera, renderer) {

    // auto resize
    window.addEventListener("resize", onWindowResize, false);

    // 禁止右鍵
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault()
    });

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}


function initMoveEvent(player, bound, audioListener) {

    // 監聽鍵盤按鍵事件，並回傳所按的按鍵為何
    window.addEventListener('keydown', onKeyDown, false);

    var isMoving = false;
    var nextPoint; // 下一個位置

    function onKeyDown(e) {
        if (!isGameStart || isMoving) {
            return;
        }
        switch (e.which) {
            case 38:
                // up
                nextPoint = xzToPoint(player.cube.position.x, player.cube.position.z - 1);

                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.cube.position.z == -bound) {
                    break;
                }
                var nextPosition = player.cube.position.clone();

                nextPosition.z -= 1;
                Move(nextPosition);

                break;
            case 37:
                // left
                nextPoint = xzToPoint(player.cube.position.x - 1, player.cube.position.z);
                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.cube.position.x == -bound) {
                    break;
                }
                var nextPosition = player.cube.position.clone();

                nextPosition.x -= 1;
                Move(nextPosition);
                break;
            case 39:
                // right
                nextPoint = xzToPoint(player.cube.position.x + 1, player.cube.position.z);
                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.cube.position.x == bound) {
                    break;
                }
                var nextPosition = player.cube.position.clone();

                nextPosition.x += 1;
                Move(nextPosition);
                break;
            case 40:
                // down
                nextPoint = xzToPoint(player.cube.position.x, player.cube.position.z + 1);
                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.cube.position.z == bound) {
                    break;
                }
                var nextPosition = player.cube.position.clone();

                nextPosition.z += 1;
                Move(nextPosition);
                break;

        }

    }

    function Move(toPosition) {
        isMoving = true;
        let v = player.cube.position;
        let vTo = toPosition;
        player.position.x = vTo.x;
        player.position.z = vTo.z;
        new TWEEN.Tween(v)
            .to(vTo, 50)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {

            })
            .onComplete(() => {
                isMoving = false;
            })
            .start();

       makeSound(audioListener, '/assets/sounds/footstep.ogg', 1);
    }

}