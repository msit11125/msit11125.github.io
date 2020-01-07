function detectmob() {
    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    ) {
        return true;
    }
    else {
        return false;
    }
}


if (detectmob()) {
    $('#mobile-control').show();
}


$('.btn-keyboard-up').on('mousedown', function () {
    // event.js
    var e = { Handled: false, which: 38 };
    onKeyDown(e)
});
$('.btn-keyboard-left').on('mousedown', function () {
    // event.js
    var e = { Handled: false, which: 37 };
    onKeyDown(e)
});
$('.btn-keyboard-right').on('mousedown', function () {
    // event.js
    var e = { Handled: false, which: 39 };
    onKeyDown(e)
});
$('.btn-keyboard-down').on('mousedown', function () {
    // event.js
    var e = { Handled: false, which: 40 };
    onKeyDown(e)
});