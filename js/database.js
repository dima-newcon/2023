const USE_LOCAL = true;

var DATABASE = {};
var SHEET_ID = '1dPq1y9cQqf-2d6J56u93y1FHTi5LRtVZ1gpvJcrmzSk';
var API_KEY = 'AIzaSyCF5muJe5QsZnMSwjmFzofH5b3Ay-GgccY';

function loadDatabase(sheetName, onload) {
  if (USE_LOCAL) {
    fetch(URL_PREFIX+"js/db/"+sheetName+".json")
    .then((response) => response.json())
    .then((data) => {
      let keyProperty = "팀명";
      if (sheetName == "artists") keyProperty = "이름(한글)";
      DATABASE[sheetName] = jsonToObject(data, keyProperty);
      if (onload) onload();
    });
  } else {
    fetch("https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/"+sheetName+"/?key="+API_KEY)
    .then((response) => response.json())
    .then((data) => {
      DATABASE[sheetName] = sheetArrayToObject(data.values);
      if (onload) onload();
    });
  }
}

function sheetArrayToObject(arr) {
  const obj = {};
  const keys = arr[0];

  for (let row=1; row<arr.length; row++) {
    const name = arr[row][0];
    var value = {};
    for (let col=1; col<keys.length; col++) {
      value[keys[col]] = arr[row][col];
    }
    obj[name] = value;
  }

  return obj;
}

function jsonToObject(json, keyProperty) {
  const obj = {};

  for (let data of json) {
    obj[data[keyProperty]] = data;
  }

  return obj;
}
