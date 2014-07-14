// Serial used from your Arduino board
//const DEVICE_PATH = 'COM11'; // PC
//const DEVICE_PATH = '/dev/ttyACM0'; // Ubuntu
const DEVICE_PATH = '/dev/tty.usbmodem1d11'; //MAC FW
const serial = chrome.serial;
// 
var sendToMatrixData = '',
    pos = '';

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

function getLocation() {
    console.log('--------------' + arguments.callee.name + '--------------');
    if (navigator.geolocation) {
        console.log('navigator.geolocation.getCurrentPosition(getTemp): ' + navigator.geolocation.getCurrentPosition(getTemp));
        navigator.geolocation.getCurrentPosition(getTemp);
    } else {
        console.log = "Geolocation is not supported by this browser.";
        document.getElementById('temp').innerHTML = 'Geolocation is not supported by this browser. So no just the temp.';
    }
}

getLocation();

function getTemp(position) {
    pos = position.coords.latitude + "," + position.coords.longitude;
    var http = new XMLHttpRequest();
    console.log('position.coords.latitude + "," + position.coords.longitude: ' + pos);

    http.open("GET", "http://justthetemp.com/getWeather.php?position=" + pos, true);

    http.onload = function (event) {

        var parsedData = '';
        parsedData = JSON.parse(this.response);

        sendToMatrixData = parsedData.temp + 'F ' + parsedData.conditions;
        //sendToMatrixData = parsedData.temp + 'F';
        console.log('1 inside sendToMatrixData: ' + sendToMatrixData);

    };
    http.send();
    console.log('2 oustside  sendToMatrixData: ' + sendToMatrixData);
}

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
var ab2str = function (buf) {
    console.log('ab2str');
    var bufView = new Uint8Array(buf);
    var encodedString = String.fromCharCode.apply(null, bufView);
    return decodeURIComponent(escape(encodedString));
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
var str2ab = function (str) {
    console.log('str2ab');

    var encodedString = unescape(encodeURIComponent(str));
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var SerialConnection = function () {
    console.log('SerialConnection');
    this.connectionId = -1;
    this.lineBuffer = "";
    this.boundOnReceive = this.onReceive.bind(this);
    this.boundOnReceiveError = this.onReceiveError.bind(this);
    this.onConnect = new chrome.Event();
    this.onReadLine = new chrome.Event();
    this.onError = new chrome.Event();
};

SerialConnection.prototype.onConnectComplete = function (connectionInfo) {
    console.log('onConnectComplete');

    if (!connectionInfo) {
        log("<b>Status:</b> Connection failed.");
        return;
    }
    this.connectionId = connectionInfo.connectionId;
    chrome.serial.onReceive.addListener(this.boundOnReceive);
    chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
    this.onConnect.dispatch();
};

SerialConnection.prototype.onReceive = function (receiveInfo) {
    console.log('onReceive');

    if (receiveInfo.connectionId !== this.connectionId) {
        console.log('if receiveInfo.connectionId in onReceive');
        return;
    }

    this.lineBuffer += ab2str(receiveInfo.data);

    var index;
    while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
        var line = this.lineBuffer.substr(0, index + 1);
        this.onReadLine.dispatch(line);
        this.lineBuffer = this.lineBuffer.substr(index + 1);
    }

};

SerialConnection.prototype.onReceiveError = function (errorInfo) {
    console.log('onReceiveError');

    if (errorInfo.connectionId === this.connectionId) {
        this.onError.dispatch(errorInfo.error);
    }
};

SerialConnection.prototype.connect = function (path) {
    console.log('connect');

    serial.connect(path, this.onConnectComplete.bind(this));
};

SerialConnection.prototype.send = function (msg) {
    console.log('send');

    if (this.connectionId < 0) {
        throw '<b>Status:</b> Invalid connection.';
    }
    console.log(str2ab(msg));
    serial.send(this.connectionId, str2ab(msg), function () {});
};

SerialConnection.prototype.disconnect = function () {
    console.log('disconnect');

    if (this.connectionId < 0) {
        throw '<b>Status:</b> Invalid connection.';
    }
    serial.disconnect(this.connectionId, function () {});
};

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var connection = new SerialConnection();

connection.onConnect.addListener(function () {
    console.log('onConnect.addListener');

    log('<b>Status:</b> connected to port  ' + DEVICE_PATH);
    connection.send("78F Rainy");
});

connection.onReadLine.addListener(function (line) {
    console.log('onReadLine.addListener');

    logJSON(line);
});

connection.connect(DEVICE_PATH);

function log(msg) {
    console.log('log');

    $('#buffer').append(msg + '');
}

//var is_on = false;
$('button').click(function () {
    console.log('button click');
    //getLocation();
    console.log('3 button: ' + sendToMatrixData);

    connection.send(sendToMatrixData);
    //connection.send(pos);

});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

chrome.alarms.create("getData", {
    periodInMinutes: 120000 // 2 
});


chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log('Alarm!');
    if (alarm.name == 'getData') {
        connection.send(sendToMatrixData);
    }
});

chrome.runtime.onStartup.addListener(function () {
    console.log('App started, sending data...');
    connection.send(sendToMatrixData);
});