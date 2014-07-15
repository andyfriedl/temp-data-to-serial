/***************************************
* Send serial data and display in matrix.
* Update matrix when new serial data.
***************************************/
#include <Wire.h>
#include "Adafruit_LEDBackpack.h"
#include "Adafruit_GFX.h"

Adafruit_8x8matrix matrix = Adafruit_8x8matrix();
int x, srlLen, srtLenNum;
String content = "";   
char characters; 

void setup() {
matrix.setRotation(1);
matrix.begin(0x70);  // Pass in the address
Serial.begin(9600);  // Initialize serial port
Serial.flush();
}

void loop() {

matrix.setBrightness(1);  // 1 = dimmest, 15 = brightest

if (Serial.available()) {
content = ""; // Clear content before using
while(Serial.available() > 0) {
//Serial.print(Serial.read());
characters = Serial.read();
content.concat(characters);
//delay (10);
}
//content.trim(); // Trim what was sent
}

if (content != "") {
matrix.clear();
matrix.setTextWrap(false);
matrix.setTextColor(LED_ON);

srlLen = content.length();// Get the length of content

// Allow the matrix to display the full lenght of content.
// 8 pixels per character. Make negative to move the content off the matrix before scroll.
srtLenNum = srlLen*8*-1;  
//content.replace(' ', '_');

// Scroll caracters on matrix
for (int8_t x=8; x>= srtLenNum; x--) {
matrix.clear();
matrix.setCursor(x,0);
matrix.print(content);
matrix.writeDisplay();
delay(77);
}
}
}
