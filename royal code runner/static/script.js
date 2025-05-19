const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let x = 50;
let y = 300;
let velocityY = 0;
let gravity = 1;
let isJumping = false;

const thiefImg = new Image();
thiefImg.src = "/static/frog.avif";

function drawGround() {
  ctx.fillStyle = "#001a4d";
  ctx.fillRect(0, 350, canvas.width, 50);
}

function drawThief() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();
  ctx.drawImage(thiefImg, x, y, 40, 50);
}

function move(direction, steps) {
  return new Promise(resolve => {
    let moved = 0;
    const stepPixels = 10;
    const interval = setInterval(() => {
      if (moved >= steps * stepPixels) {
        clearInterval(interval);
        resolve();
        return;
      }
      x += direction === "right" ? 2 : -2;
      moved += 2;
      drawThief();
    }, 15);
  });
}

function jump() {
  return new Promise(resolve => {
    if (isJumping) return resolve();
    isJumping = true;
    velocityY = -15;
    const interval = setInterval(() => {
      y += velocityY;
      velocityY += gravity;
      drawThief();
      if (y >= 300) {
        y = 300;
        velocityY = 0;
        isJumping = false;
        clearInterval(interval);
        resolve();
      }
    }, 30);
  });
}

function wait(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function tokenize(input) {
  const tokens = [];
  const regex = /\b(moveRight|moveLeft|jump|wait)\b|\d+/gi;
  let match;
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

function buildParseTree(actions) {
  let tree = "";
  actions.forEach((a, i) => {
    if (a.type === "move") tree += `Command ${i + 1}: MOVE ${a.direction.toUpperCase()} by ${a.steps} steps\n`;
    else if (a.type === "jump") tree += `Command ${i + 1}: JUMP\n`;
    else if (a.type === "wait") tree += `Command ${i + 1}: WAIT for ${a.time} seconds\n`;
  });
  return tree;
}

async function execute(actions) {
  for (const action of actions) {
    if (action.type === "move") {
      await move(action.direction, action.steps);
    } else if (action.type === "jump") {
      await jump();
    } else if (action.type === "wait") {
      await wait(action.time);
    }
  }
}

function runCode() {
  const code = document.getElementById("codeInput").value;
  const tokens = tokenize(code);
  document.getElementById("tokens").innerText = "Tokens:\n" + tokens.join(" | ");

  fetch("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }
      document.getElementById("parseTree").innerText = buildParseTree(data.actions);
      x = 50;
      y = 300;
      drawThief();
      execute(data.actions);
    });
}

function runCommand(command) {
  const codeInput = document.getElementById("codeInput");
  if (!codeInput.value.endsWith('\n') && codeInput.value.length > 0) {
    codeInput.value += '\n';
  }
  codeInput.value += command + '\n';
  runCode();
}

window.onload = () => {
  drawThief();
};
