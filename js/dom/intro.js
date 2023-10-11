const HALF_PI = Math.PI/2;
const DOUBLE_PI = Math.PI*2;
var resizeObserver;

function initTeamsIntro() {
  resizeObserver = new ResizeObserver(function(entries) {
    for (let entry of entries) {
      const svg = entry.target;
      const rect = svg.getBoundingClientRect();
      svg.dataset.left = rect.left;
      svg.dataset.top = rect.top;
    }
  });

  document.addEventListener("mousemove", updateMouse);
  for (let teamName in DATABASE.teams) {
    createTeamCard(teamName, DATABASE.teams[teamName]);
  }

  remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
  _previousFrame = new Date();
  window.addEventListener("blur", function() {
    for (let svg of svgs) {
      for (let i=svg.children.length-1; i>=0; i--) {
        const circle = svg.children[i];
        circle.dataset.alive = "false";
        circle.setAttribute("r", "0px");
      }
    }
  });
  window.addEventListener("focus", function() {
    _previousFrame = Date.now();
  });
  animate();
}

const cardContainer = document.getElementById("card-container");
const colors = [
  { r:232, g:168, b:185 },
  { r:241, g:218, b:164 },
  { r:153, g:205, b:157 },
  { r:124, g:197, b:203 },
  { r:219, g:193, b:233 }
];
var currentColor = "rgb(255,255,255)";
var colorIndex = 0;
var svgs = [];
var hoveredSVG;
var mouse = { x: -1, y: -1, velocity: 0, spread: 0 };
var remToPx = 1;
function createTeamCard(teamName, data) {
  const card = document.createElement("div");
  card.className = "card";

  const flexbox = document.createElement("div");
  flexbox.className = "flexbox";
  card.appendChild(flexbox);

  const team = document.createElement("div");
  team.className = "card-team";
  team.textContent = teamName;
  flexbox.appendChild(team);

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = data["작품명"];
  flexbox.appendChild(title);

  const cd = document.createElement("img");
  cd.className = "card-cd";
  cd.src = "../res/teams/"+teamName+"/cd.png";
  card.appendChild(cd);

  const members = document.createElement("div");
  members.className = "card-members";
  var membersList = "";
  for (let member of data["팀원"].split(",")) {
    membersList += member+" ";
  }
  members.textContent = membersList;
  card.appendChild(members);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("filter", "url(#goo-filter)");
  card.appendChild(svg);
  svgs.push(svg);

  card.addEventListener("mouseenter", function(e) {
    const newSVG = this.querySelector("svg");
    if (hoveredSVG != newSVG) {
      mouse.spread = 0;
    }
    hoveredSVG = newSVG;
  });
  card.addEventListener("mouseleave", function(e) {
    hoveredSVG = null;
  });
  card.dataset.team = teamName;
  card.onclick =
  flexbox.onclick =
  team.onclick =
  title.onclick =
  cd.onclick =
  members.onclick =
  function() {
    window.location.href = window.location.href.split("#")[0]+"#"+this.dataset.team;
    location.reload();
  }.bind(card);

  cardContainer.appendChild(card);

  fillCircleBuffer(svg);
  svg.dataset.bufferIndex = 0;
  svg.dataset.left = 0;
  svg.dataset.top = 0;
  resizeObserver.observe(svg);
}

function updateMouse(e) {
  const dx = e.movementX;
  const dy = e.movementY;

  const sqrmagnitude = dx * dx + dy * dy;
  const delta = sqrmagnitude;

  mouse.spread /= 1.5;

  if (hoveredSVG) {
    colorIndex += delta/window.innerWidth/2;
    while (colorIndex >= colors.length-1) colorIndex -= colors.length-1;
    const a = colorIndex | 0;
    var b = a >= colors.length-2 ? 0 : Math.ceil(colorIndex);

    const interpolatedColor = colorInterpolate(colors[a], colors[b], colorIndex%1);
    currentColor = "rgb("+interpolatedColor.r+","+interpolatedColor.g+","+interpolatedColor.b+")";

    mouse.x = e.pageX;
    mouse.y = e.pageY;

    const lifespan = (Math.random() * 2 + Math.min(3, 5));
    const circle = createCircle(
      (mouse.x - hoveredSVG.dataset.left),
      (mouse.y - hoveredSVG.dataset.top),
      currentColor, lifespan
    );
    circle.dataset.elapsed = lifespan/4;
  }
}

var _previousFrame;
function animate() {
  const now = Date.now();
  const delta = now - _previousFrame;
  _previousFrame = now;

  if (hoveredSVG) {
    if (mouse.spread > 0) {
      const ox = (Math.random() - .5) * mouse.spread;
      const oy = (Math.random() - .5) * mouse.spread;
      createCircle(
        ox + (mouse.x - hoveredSVG.dataset.left),
        oy + (mouse.y - hoveredSVG.dataset.top),
        currentColor, 3 + Math.random() * 7
      );
    }

    mouse.spread = Math.min(mouse.spread + delta/100, 1) * window.innerWidth/5;
  }

  for (let svg of svgs) {
    for (let i=svg.children.length-1; i>=0; i--) {
      const circle = svg.children[i];

      if (circle.dataset.alive != "false") {
        const time = lerp(0, DOUBLE_PI, circle.dataset.elapsed/circle.dataset.lifetime);
        var r = (.5 + Math.sin(time - HALF_PI)/2) * Number(circle.dataset.maxRadius);

        circle.setAttribute("r", (r * remToPx)+"px");

        const elapsed = Number(circle.dataset.elapsed);
        const lifetime = Number(circle.dataset.lifetime);

        circle.dataset.elapsed = elapsed + delta/500;

        if (elapsed >= lifetime) {
          circle.dataset.alive = "false";
          circle.setAttribute("r", "0");
        }
      }
    }
  }

  requestAnimationFrame(animate);
}

function fillCircleBuffer(svg) {
  for (let i=0; i<500; i++) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.dataset.alive = "false";
    svg.appendChild(circle);
  }
}

function createCircle(x, y, color, lifetime) {
  var bufferIndex = Number(hoveredSVG.dataset.bufferIndex);
  const circle = hoveredSVG.children[bufferIndex];
  bufferIndex++;
  if (bufferIndex >= hoveredSVG.children.length) {
    bufferIndex = 0;
  }
  hoveredSVG.dataset.bufferIndex = bufferIndex;

  circle.setAttribute("fill", color);
  circle.dataset.elapsed = 0;
  circle.dataset.lifetime = lifetime;
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.dataset.alive = "true";
  circle.dataset.maxRadius = lifetime/3;

  return circle;
}
