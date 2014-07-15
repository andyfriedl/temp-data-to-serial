//////////////////////////////////////////////////////
// get weather data, send to serial port
/////////////////////////////////////////////////////
/*jshint -W117 */

var serialPort = '';

var onGetDevices = function(ports) {
    for (var i = 0; i < ports.length; i++) {
        //console.log('fn onGetDevices for loop:' + ports[i].path);
    }
    serialPort = ports[0].path;

};
chrome.serial.getDevices(onGetDevices);

//const DEVICE_PATH = 'COM11'; // PC
const DEVICE_PATH = '/dev/ttyACM0'; // Ubuntu
//DEVICE_PATH = serialPort; // Ubuntu
//const DEVICE_PATH = '/dev/tty.usbmodem1d11'; //MAC FW
const serial = chrome.serial;
//
var sendToMatrixData = '',
    pos = '';
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
function getLocation() {
    // console.log('--------------' + arguments.callee.name + '--------------');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getTemp);
    }
    else {
        console.log = "Geolocation is not supported by this browser.";
        log('<span style="color:red"><b>Status:</b> Geolocation is not supported by this browser.</span>');
        document.getElementById('temp').innerHTML = 'Geolocation is not supported by this browser. So no just the temp.';
    }
}

getLocation();

function getTemp(position) {
    pos = position.coords.latitude + "," + position.coords.longitude;
    var http = new XMLHttpRequest();
    http.open("GET", "**** link to your weather api of choice ****" + pos, true);

    http.onload = function(event) {
        var parsedData = '';
        parsedData = JSON.parse(this.response);
        sendToMatrixData = ' ' + parsedData.temp + 'F ' + parsedData.conditions;
    };
    http.send();
}

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

// Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer.
var str2ab = function(str) {
    var encodedString = unescape(encodeURIComponent(str));
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};


////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var SerialConnection = function() {
    this.connectionId = -1;
    this.lineBuffer = "";
    this.onConnect = new chrome.Event();
    this.onReadLine = new chrome.Event();
    this.onError = new chrome.Event();
};

SerialConnection.prototype.onConnectComplete = function(connectionInfo) {

    if (!connectionInfo) {
        log('<b>Status: </b><span class="error"> Connection failed.</span>');
        return;
    }
    this.connectionId = connectionInfo.connectionId;
    this.onConnect.dispatch();
};

SerialConnection.prototype.connect = function(path) {
    serial.connect(path, this.onConnectComplete.bind(this));
};

SerialConnection.prototype.send = function(msg) {
    if (this.connectionId < 0) {
        throw '<b>Status: </b><span class="error"> Invalid connection.</span>';
    }
    serial.send(this.connectionId, str2ab(msg), function() {});
};

SerialConnection.prototype.disconnect = function() {
    if (this.connectionId < 0) {
        throw '<b>Status: </b><span class="error"> Invalid connection.</span>';
    }
    serial.disconnect(this.connectionId, function() {});
};

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////


var connection = new SerialConnection();

connection.onConnect.addListener(function() {
    log('<b>Status: </b><span class="success"> Connected to port ' + DEVICE_PATH + '</span>');
});

connection.onReadLine.addListener(function(line) {
    logJSON(line);
});
// connect to serial port
connection.connect(DEVICE_PATH);

function log(msg) {
    $('#buffer').append(msg + '');
}

//var is_on = false;
$('button').click(function() {
    getLocation();
    connection.send(sendToMatrixData);

});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

chrome.alarms.create('getData', {
    delayInMinutes: 1,
    periodInMinutes: 2
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name == 'getData') {
        console.log('In getData alarm' + sendToMatrixData);
        getLocation();
        connection.send('-' + sendToMatrixData + '-');
    }
});
/**/
//connection.send(sendToMatrixData);
// not showing in log.

setInterval(function() {
    console.log('In interval fn, sent: ' + sendToMatrixData);
    getLocation();
    connection.send('..' + sendToMatrixData + '..');
}, 30000);

//setInterval(connection.send(interval),600000);


chrome.app.runtime.onLaunched.addListener(function() {
    console.log('App launched, sending data...' + sendToMatrixData);
    // wait to receive data before send
    setTimeout(function() {
        console.log('\n\n *** In onLaunched setTimeout fn, sent: ' + sendToMatrixData + ' ***');
        getLocation();
        connection.send('===' + sendToMatrixData + '===');
    }, 500);

    //connection.send(sendToMatrixData);
});
// only when chrome starts
chrome.runtime.onStartup.addListener(function() {
    console.log('chrome started, sending data...');
    getLocation();
    connection.send('****' + sendToMatrixData+ '****');
});