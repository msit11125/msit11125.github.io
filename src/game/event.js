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
    document.addEventListener('keydown', onKeyDown, false);

    var nextPoint; // 下一個位置


    function loop(e) {

        switch (e.which) {
            case 38:
            case 87:
                // up
                nextPoint = xzToPoint(player.position.x, player.position.z - 1);

                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.position.z == -bound) {
                    break;
                }
                var nextPosition = player.position.clone();

                nextPosition.z -= 1;
                Move(nextPosition);

                break;
            case 37:
            case 65:
                // left
                nextPoint = xzToPoint(player.position.x - 1, player.position.z);
                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.position.x == -bound) {
                    break;
                }
                var nextPosition = player.position.clone();

                nextPosition.x -= 1;
                Move(nextPosition);
                break;
            case 39:
            case 68:
                // right
                nextPoint = xzToPoint(player.position.x + 1, player.position.z);
                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.position.x == bound) {
                    break;
                }
                var nextPosition = player.position.clone();

                nextPosition.x += 1;
                Move(nextPosition);
                break;
            case 40:
            case 83:
                // down
                nextPoint = xzToPoint(player.position.x, player.position.z + 1);
                if (theMatrix[nextPoint.row][nextPoint.col] == 1) {
                    break;
                }
                if (player.position.z == bound) {
                    break;
                }
                var nextPosition = player.position.clone();

                nextPosition.z += 1;
                Move(nextPosition);
                break;

        }

    }

    function onKeyDown(e) {
        if (!isGameStart) {
            return;
        }

        loop(e);

    }

    function Move(toPosition) {
        
        let v = player.instance.cube.position;
        let vTo = toPosition;
        player.position.x = vTo.x;
        player.position.z = vTo.z;

        new TWEEN.Tween(v)
            .to(vTo, 100)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {

            })
            .onComplete(() => {
                
                makeSound(audioListener, '/assets/sounds/footstep1.ogg', 0.5);
                // check eating egg

                eggs.forEach((egg, i, array) => {

                    if (egg.position.x == vTo.x && egg.position.z == vTo.z) {
                        console.log(vTo)
                        makeSound(audioListener, '/assets/sounds/getcoin.wav', 0.7);

                        // remove egg
                        scene.remove(egg);
                        array.splice(i, 1);

                        // get score
                        score += 10;
                        $("#scoreBoard").text(score);
                        
                        var sprite = makeTextSprite("+10");
                        vTo.y = 2;
                        sprite.position.copy(vTo);
                        scene.add(sprite);
                        
                        setTimeout(function () {
                            scene.remove(sprite);
                        }, 1000)
                    }
                });
            })
            .start();

    }

}