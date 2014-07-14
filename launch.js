chrome.app.runtime.onLaunched.addListener(function () {
    console.log('chrome.app.runtime.onLaunched.addListener in launch.js...');


    chrome.app.window.create('index.html', {
        id: "mainwin",
        bounds: {
            width: 600,
            height: 270
        }
    });
});