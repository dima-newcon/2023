var tray = document.getElementsByClassName("tray")[0];
var trayButton = document.getElementById("toggle-tray-button");
var canvas = document.querySelector("canvas");
var context = canvas.getContext("2d");

var audioContext, gainNode, analyserNode, bufferLength, dataArray;
function initializeAudio() {
  audioContext = new AudioContext({
    latencyHint: "interactive"
  });

  analyserNode = new AnalyserNode(audioContext);
  analyserNode.fftSize = 512;
  analyserNode.connect(audioContext.destination);

  bufferLength = analyserNode.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

const colors = [
  { r:232, g:168, b:185 },
  { r:241, g:218, b:164 },
  { r:153, g:205, b:157 },
  { r:124, g:197, b:203 },
  { r:219, g:193, b:233 }
];

var playTransitionTime = 0;
function animate(delta) {
  context.resetTransform();
  context.translate(canvas.width/2, canvas.height/2);
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
  context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);

  if (CDP.destination) {
    if (CDP.position.x != CDP.destination.x) {
      CDP.position.x = lerp(CDP.position.x, CDP.destination.x, delta/200);
    }
    if (CDP.position.y != CDP.destination.y) {
      CDP.position.y = lerp(CDP.position.y, CDP.destination.y, delta/200);
    }
  }

  // not sure if it's just -canvas.width/4 or -canvas.width/2/window.devicePixelRatio -- test on other devices
  let x = CDP.position.x - canvas.width/2/window.devicePixelRatio;
  let y = CDP.position.y - canvas.height/2/window.devicePixelRatio;

  context.translate(x, y);

  let playtime = playTransitionTime;

  if (currentPlaying) {
    playTransitionTime += delta/2000;
    if (playTransitionTime >= 1) playTransitionTime = 1;

    analyserNode.getByteFrequencyData(dataArray);

    context.save();
    context.rotate(-Math.PI/2);

    let t = currentPlaying.audio.currentTime/currentPlaying.audio.duration;
    let angle = Math.PI*2 * t;
    let r = CDP.radius - 20;
    let point = new Vector2(
      r * Math.cos(angle),
      r * Math.sin(angle)
    );
    context.beginPath();

    let color = colorAtTime(t);
    context.fillStyle = "rgb("+color.r+","+color.g+","+color.b+")";
    context.arc(point.x, point.y, 5 * smoothstep(playtime), 0, Math.PI*2);
    context.fill();

    context.restore();
  } else {
    playTransitionTime -= delta/1000;
    if (playTransitionTime <= 0) playTransitionTime = 0;
  }

  context.save();
  context.rotate(Math.PI/1.5);

  context.lineWidth = Math.max(1, Math.round(CDP.radius/100));

  for (let i=0; i<bufferLength; i++) {
    if (1-(i/bufferLength) <= smoothstep(1-playtime)) continue;

    const value = dataArray[i]/255;

    let color = colorAtTime(i/bufferLength);
    let a = Math.max(value, .5) * playtime;

    context.strokeStyle = "rgba("+color.r+","+color.g+","+color.b+","+a+")";

    drawFrequencyBit(dataArray, i);
  }

  context.lineWidth = 1;
  let a = smootherstep(1-playtime);
  context.strokeStyle = "rgba(112, 112, 112, "+a+")";
  context.beginPath();
  context.arc(0, 0, CDP.radius, Math.PI*2 * smootherstep(playtime), Math.PI*2);
  context.stroke();

  context.restore();

  context.textBaseline = "middle";
  context.fillStyle = "#DDDDDD";
  context.font = "12px 'Apple SD Gothic Neo'";
  if (trayOpen) {
    context.textAlign = "left";
  } else {
    context.textAlign = "center";
  }
  x = trayOpen ? CDP.position.x+15 : 0;
  y = trayOpen ? -CDP.radius/2-20 : -CDP.radius-40;
  context.fillText("듣고 싶은 CD를 플레이어 위에 올려주세요.", x, y);

  if (currentPlaying) {
    context.textAlign = "center";
    let y = -currentPlaying.idleRadius - windowMinSize/30 + (smoothstep(1-playtime*2) * windowMinSize/50);
    context.fillStyle = "black";
    let fontSize = windowMinSize/50;
    context.font = "bold "+fontSize+"px 'Apple SD Gothic Neo'";
    context.fillText(currentPlaying.musicTitle, 0, y - (fontSize + windowMinSize/100));
    context.font = (fontSize*.8)+"px 'Apple SD Gothic Neo'";
    context.fillText(currentPlaying.musicArtist, 0, y);

    y = currentPlaying.idleRadius + windowMinSize/27;
    context.strokeStyle = "black";
    context.lineWidth = 1;
    let width = smootherstep(playtime) * windowMinSize/25;
    context.beginPath();
    context.moveTo(-width/2, y);
    context.lineTo(width/2, y);
    context.stroke();

    width += 10;
    context.textAlign = "right";
    context.fillText(timeString(currentPlaying.audio.currentTime), -width/2, y);
    context.textAlign = "left";
    context.fillText(timeString(currentPlaying.audio.duration), width/2, y);
  }
}

function colorAtTime(t) {
  let colorIndex = t * colors.length | 0;
  let nextColor = colorIndex+1 >= colors.length ? colors[0] : colors[colorIndex+1];
  let color = colors[colorIndex];

  let unit = 1/colors.length;
  while (t >= unit) t -= unit;
  t *= colors.length;

  return {
    r: lerp(color.r, nextColor.r, t),
    g: lerp(color.g, nextColor.g, t),
    b: lerp(color.b, nextColor.b, t)
  }
}

function millisecondDiff(myDate) {
  var midnightDay = myDate.getUTCDate();
  var midnightMonth = myDate.getUTCMonth() + 1;
  var midnightYear = myDate.getUTCFullYear();
  var midnightMilliseconds = new Date(midnightYear + '/' + midnightMonth + '/' + midnightDay).getTime();
  return new Date().getTime() - midnightMilliseconds;
}

function timeString(seconds) {
  let sec = Math.floor(seconds%60);
  let min = Math.floor(seconds/60);

  if (sec < 10) sec="0"+sec;
  if (min < 10) min="0"+min;

  return min+":"+sec;
}

function copyArray(src)  {
  var dst = new ArrayBuffer(bufferLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
}

function drawFrequencyBit(array, index) {
  const r = CDP.radius;

  const value = array[index]/255;
  const length = 2 + value * windowMinSize/20;

  const theta = Math.PI*2 / array.length;
  const angle = theta * index;
  const start = new Vector2(
    (r+length) * Math.cos(angle),
    (r+length) * Math.sin(angle)
  );
  const end = new Vector2(
    (r-length/3) * Math.cos(angle),
    (r-length/3) * Math.sin(angle)
  );

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

//

var dragging;
var currentPlaying;
var windowMinSize;

var CDP = {
  radius: 0,
  centerPosition: null,
  trayOpenPosition: null,
  position: new Vector2(window.innerWidth/2, window.innerHeight/2),
  destination: null
};

function setCDP() {
  windowMinSize = Math.min(window.innerHeight, window.innerWidth);

  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;

  if (window.innerWidth <= 480) {
    windowMinSize *= 1.4;
    CDP.trayOpenPosition = new Vector2(window.innerWidth/2, window.innerHeight/1.5);
  } else {
    CDP.trayOpenPosition = new Vector2(window.innerWidth/3.5, window.innerHeight/2);
  }

  CDP.centerPosition = new Vector2(window.innerWidth/2, window.innerHeight/2);
  CDP.radius = windowMinSize/3.75;

  for (let cd of draggableCDs) {
    cd.idleRadius = windowMinSize/9;
    cd.dragRadius = cd.idleRadius + 10;
    cd.setRadius(cd.idleRadius);
  }

  if (trayOpen) {
    CDP.destination = CDP.trayOpenPosition.copy();
  } else {
    CDP.destination = CDP.centerPosition.copy();
  }
}

window.onresize = setCDP;

document.onblur = function() {
  if (dragging) dragging.drop();
}
document.onmouseup = function (e) {
  if (dragging) {
    let cd = dragging;
    cd.drop(e.pageX, e.pageY);
    if (e.target == tray || e.target.parentNode == tray) {
      cd.enterTray();
    }
  }
}
document.ontouchend = function(e) {
  if (dragging) {
    var touch = e.changedTouches[0];
    dragging.drop(touch.pageX, touch.pageY);
  }
};

document.onmousemove = function(e) {
  if (dragging) {
    dragging.move(e.pageX, e.pageY);
  }
}
document.ontouchmove = function(e) {
  e.preventDefault();
  if (dragging) {
    var touch = e.touches[0];
    dragging.move(touch.pageX, touch.pageY);
  }
}

document.addEventListener("keydown", function(e) {
  if (e.key == " ") {
    if (document.activeElement == document.body) {
      toggleTrack();
    }
  }
  if (e.key == "ArrowLeft" || e.key == "ArrowUp") {
    prevTrack();
  }
  if (e.key == "ArrowRight" || e.key == "ArrowDown") {
    nextTrack();
  }
});

var lastTick;
function tick() {
  var current = new Date();
  var delta = current - lastTick;
  lastTick = current;
  requestAnimationFrame(tick);

  for (let cd of draggableCDs) {
    cd.update(delta);
  }

  animate(delta);
}

var draggableCDs = [];
class DraggableCD {
  constructor(team) {
    this.team = team;
    this.musicTitle = DATABASE.teams[team]["음원 제목"];
    this.musicArtist = DATABASE.teams[team]["음원 아티스트"];
    this.musicDesc = DATABASE.teams[team]["음원 설명"];

    let li = document.createElement("li");
    let anchor = document.createElement("a");
    anchor.textContent = team;
    anchor.onclick = function() {
      if (currentPlaying != this) {
        for (let button of document.getElementsByClassName("play-button")) {
          button.classList.add("paused");
        }
      } else {
        for (let button of document.getElementsByClassName("play-button")) {
          button.classList.remove("paused");
        }
      }
      this.select();
    }.bind(this);
    li.appendChild(anchor);
    document.querySelector("ol").appendChild(li);
    this.listElement = li;

    // image
    var img = createElement("img", { src: "../res/teams/"+team+"/cd.png" });

    img.ontouchstart = function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      this.drag(touch.pageX, touch.pageY);
    }.bind(this);
    img.onmousedown = function(e) {
      this.drag(e.pageX, e.pageY);
    }.bind(this);

    img.classList.add("cd");
    img.setAttribute("draggable", false);
    this.imageElement = img;

    // physics

    this.inTray = false;

    this.dragging = false;
    this.playing = false;

    this.position = new Vector2();
    this.destination = null;
    this.velocity = new Vector2();
    this.timeToTray = 0;

    this.speed = .1;
    this.friction = 1.2;
    this.escapeCollisionSpeed = .2;

    this.rotation = 0;
    this.rotationSpeed = .001;
    this.rotationVelocity = 0;
    this.rotationFriction = 1.1;

    this.playRotationSpeed = .00008;
    this.playRotationCap = .2;

    this.radius = 0;
    this.idleRadius = 90;
    this.dragRadius = 100;
    this.setRadius(this.idleRadius);

    this.audio = new Audio("../res/teams/"+team+"/musicmixed.mp3");
    this.audio.addEventListener("canplaythrough", this.playerReady.bind(this));
    this.audio.addEventListener("ended", function() {
      this.enterTray();
      nextTrack();
    }.bind(this));
    this.audio.load();

    //

    this.index = draggableCDs.length;
    draggableCDs.push(this);
  }

  playerReady() {
    this.exitTray();
  }

  setRadius(value) {
    this.radius = value;
    var diameter = this.radius * 2;

    this.imageElement.style.width = diameter+"px";
    this.imageElement.style.height = diameter+"px";
  }

  setPosition(x, y) {
    this.position = new Vector2(
      x!=null ? x : this.position.x,
      y!=null ? y : this.position.y
    );
    this.imageElement.style.left = this.position.x+"px";
    this.imageElement.style.top = this.position.y+"px";
  }

  setRotation(angle) {
    this.rotation = angle || this.rotation;
    this.imageElement.style.rotate = this.rotation+"deg";
  }

  drag(x, y) {
    this.destination = null;
    this.onreacheddestination = null;

    if (currentPlaying == this) {
      this.stop();
    }

    let parent = this.imageElement.parentElement;
    if (parent && parent == tray) {
      let rect = this.imageElement.getBoundingClientRect();
      this.setPosition(rect.left + rect.width/2, rect.top + rect.height/2);
    }

    this.exitTray();
    this.setRadius(this.dragRadius);
    this.dragging = true;
    dragging = this;
    this.imageElement.classList.add("dragging");
    document.documentElement.classList.add("dragging");
    this.dragInitials = {
      x: this.position.x - x,
      y: this.position.y - y
    };
  }

  move(x, y) {
    var movePos = new Vector2(x, y);
    if (movePos.distance(CDP.position) <= CDP.radius) {
      this.setPosition(CDP.position.x, CDP.position.y);
    } else {
      var prevPos = this.position.copy();
      var collides = false;

      this.setPosition(x + this.dragInitials.x, y + this.dragInitials.y);

      if (!collides) {
        this.velocity = this.velocity.add(this.position.sub(prevPos).mul(this.speed));

        const dx = this.position.x - prevPos.x;
        const dy = this.position.y - prevPos.y;

        this.rotationVelocity += dx * this.rotationSpeed;
        this.rotationVelocity += dy * this.rotationSpeed;
      }

      this.destination = null;
    }
  }

  drop(x, y) {
    this.setRadius(this.idleRadius);
    this.imageElement.classList.remove("dragging");
    document.documentElement.classList.remove("dragging");

    if (x && y) {
      var mousePos = new Vector2(x, y);
      if (mousePos.distance(CDP.position) <= CDP.radius) {
        if (currentPlaying) {
          currentPlaying.stop();
        }
        this.play(true);
      } else if (!currentPlaying) {
        for (let cd of draggableCDs) {
          if (cd == this) continue;
          cd.exitTray();
          closeTray();
        }
      }
    }

    this.dragging = false;
    dragging = null;
  }

  play(reset) {
    currentPlayingIndex = this.index;

    if (!audioContext) {
      initializeAudio();
    }

    if (!this.audioSource) {
      this.audioSource = audioContext.createMediaElementSource(this.audio);
      this.audioSource.connect(analyserNode);
    }

    currentPlaying = this;
    this.playing = true;
    this.rotationVelocity = 0;
    this.imageElement.classList.add("playing");
    document.documentElement.classList.add("playing");
    // nowPlaying.textContent = "NOW PLAYING: "+this.team.name+" - "+this.team.project;

    if (reset) this.audio.currentTime = 0;
    this.audio.play();

    if (playTransitionTime < 1) {
      for (let cd of draggableCDs) {
        if (cd == this) continue;
        cd.enterTray();
      }
    }

    for (let button of document.getElementsByClassName("play-button")) {
      button.classList.remove("paused");
    }

    this.select();
  }

  select() {
    document.getElementById("team-cd").src = this.imageElement.src;
    document.getElementById("music-title").textContent = this.musicTitle;
    document.getElementById("music-artist").textContent = this.musicArtist;
    document.getElementById("music-desc").textContent = this.musicDesc;
    currentPlayingIndex = this.index;
    for (let li of document.querySelectorAll("li")) {
      li.classList.remove("selected");
    }
    this.listElement.classList.add("selected");
  }

  pause() {
    this.playing = false;
    this.audio.pause();

    for (let button of document.getElementsByClassName("play-button")) {
      button.classList.add("paused");
    }
  }

  stop() {
    currentPlaying = null;

    this.playing = false;
    this.rotationVelocity = 0;
    this.imageElement.classList.remove("playing");
    document.documentElement.classList.remove("playing");

    this.audio.pause();

    if (trayOpen) {
      this.enterTray();
    }

    for (let button of document.getElementsByClassName("play-button")) {
      button.classList.add("paused");
    }
  }

  update(delta) {
    this.velocity = this.velocity.div(this.friction);

    if (this.playing) {
      this.rotationVelocity = Math.min(this.rotationVelocity + this.playRotationSpeed * delta, this.playRotationCap);
    } else {
      this.rotationVelocity /= this.rotationFriction;
    }

    if (currentPlaying == this) {
      this.setPosition(CDP.position.x, CDP.position.y);
      // this.destination = CDP.position;
    }

    if (!this.dragging) {
      this.updateCols(delta);

      if (this.velocity.x != 0 || this.velocity.y != 0) {
        const newPosition = this.position.add(this.velocity);
        this.setPosition(newPosition.x, newPosition.y);
      }
    }

    this.setRotation(this.rotation + this.rotationVelocity * delta);

    if (this.destination) {
      this.setPosition(
        lerp(this.position.x, this.destination.x, delta/300),
        lerp(this.position.y, this.destination.y, delta/300)
      );
      if (this.position.distance(this.destination) < 1) {
        this.setPosition(this.destination.x, this.destination.y);
        if (this.onreacheddestination) this.onreacheddestination();
        this.destination = null;
        this.onreacheddestination = null;
      }
    }
  }

  updateCols(delta) {
    if (this.destination || this.inTray) return;

    for (let cd of draggableCDs) {
      if (cd == this) continue;
      if (cd.dragging || cd.destination || cd.inTray) continue;
      if (this.col(cd)) {
        var direction = cd.position.sub(this.position).normalized();

        if (direction.x == 0 && direction.y == 0) {
          direction = new Vector2(Math.random(), Math.random()).normalized();
        }

        this.velocity = this.velocity.sub(direction.mul(this.escapeCollisionSpeed * delta));
        cd.velocity = cd.velocity.sub(direction.mul(-1).mul(this.escapeCollisionSpeed * delta));
      }
    }

    if (this.position.x < this.radius) {
      this.velocity.x += this.escapeCollisionSpeed * delta;
    } else if (this.position.x > window.innerWidth - this.radius) {
      this.velocity.x -= this.escapeCollisionSpeed * delta;
    }
    if (this.position.y < this.radius) {
      this.velocity.y += this.escapeCollisionSpeed * delta;
    } else if (this.position.y > window.innerHeight - this.radius) {
      this.velocity.y -= this.escapeCollisionSpeed * delta;
    }
  }

  col(cd) {
    var distance = this.position.distance(cd.position);
    if (distance <= this.radius + cd.radius) {
      return true;
    }
    return false;
  }

  enterTray() {
    if (window.innerWidth <= 480) {
      this.destination = new Vector2(window.innerWidth/2, -this.radius - 15);
    } else {
      this.destination = new Vector2(window.innerWidth + this.radius + 15, window.innerHeight/2);
    }
    this.onreacheddestination = function() {
      this.inTray = true;
      tray.appendChild(this.imageElement);
      trayButton.classList.remove("gone");
    }.bind(this);
    trayButton.classList.remove("gone");
  }

  exitTray() {
    this.destination = null;
    this.onreacheddestination = null;

    this.inTray = false;
    document.body.appendChild(this.imageElement);

    let noCDinTray = true;
    for (let cd of draggableCDs) {
      if (cd.inTray) {
        noCDinTray = false;
        break;
      }
    }
    if (noCDinTray) {
      closeTray();
      trayButton.classList.add("gone");
    }
  }
}


var trayOpen = false;

function toggleTray() {
  if (trayOpen) {
    closeTray()
  } else {
    openTray();
  }
}

function openTray() {
  tray.classList.add("open");
  trayOpen = true;
  CDP.destination = CDP.trayOpenPosition.copy();
  trayButton.firstElementChild.alt = "CD 서랍 닫기";
  trayButton.classList.add("open");
}

function closeTray() {
  tray.classList.remove("open");
  trayButton.classList.remove("open");
  trayOpen = false;
  CDP.destination = CDP.centerPosition.copy();
  trayButton.firstElementChild.alt = "CD 서랍 열기";
}

//

let currentPlayingIndex = 0;

function toggleTrack() {
  let cd = draggableCDs[currentPlayingIndex];
  if (cd == currentPlaying) {
    if (cd.playing) {
      cd.pause();
    } else {
      cd.play();
    }
  } else {
    playTrack();
  }
}

function playTrack() {
  if (currentPlaying) {
    currentPlaying.enterTray();
    currentPlaying.stop();
  }
  draggableCDs[currentPlayingIndex].exitTray();
  draggableCDs[currentPlayingIndex].play(true);
}

function prevTrack() {
  if (currentPlaying && currentPlaying.audio.currentTime >= 2) {
    currentPlaying.audio.currentTime = 0;
  } else {
    currentPlayingIndex = currentPlayingIndex > 0 ? currentPlayingIndex-1 : draggableCDs.length-1;
    playTrack();
  }
}

function nextTrack() {
  currentPlayingIndex = currentPlayingIndex < draggableCDs.length-1 ? currentPlayingIndex+1 : 0;
  playTrack();
}
