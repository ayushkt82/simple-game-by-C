const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W, H;
function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  // keep player centered on resize
  if(!player) return;
  player.x = W/2; player.y = H/2;
}
window.addEventListener('resize', resize);

const keys = {};
window.addEventListener('keydown', e=>keys[e.key]=true);
window.addEventListener('keyup', e=>keys[e.key]=false);

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

const player = {x:0,y:0,r:14,color:'#6cf',speed:300};
const chaser = {x:100,y:100,r:20,color:'#f66',speed:160};

let running = true, score = 0, last=performance.now();
let bgOffset = 0;
const scrollSpeed = 120; // background movement speed

// distance / destination (in pixels)
const totalDistance = 5000; // pixels to final destination

// create simple classic texture patterns
function makeChecker(colA, colB, size){
  const oc = document.createElement('canvas'); oc.width = oc.height = size*2; const octx = oc.getContext('2d');
  octx.fillStyle = colA; octx.fillRect(0,0,oc.width,oc.height);
  octx.fillStyle = colB; octx.fillRect(0,0,size,size); octx.fillRect(size,size,size,size);
  return ctx.createPattern(oc,'repeat');
}
const marginPattern = makeChecker('#0b0b0b','#111',6);
const roadPattern = makeChecker('#1b1b1b','#232323',8);
const vehiclePattern = makeChecker('#b33','#922',6);

// vehicles (distractions)
const vehicles = [];
let spawnTimer = 0;
const spawnBase = 2.5; // seconds

// crosswalk settings (places where crossing is allowed)
const crossSpacing = 300;
const crossHeight = 80;

const baseChaserSpeed = chaser.speed;

// load highscore from localStorage
let high = parseInt(localStorage.getItem('chase_highscore') || '0', 10);
document.getElementById('highscore').textContent = 'High: ' + high;
document.getElementById('distance').textContent = 'Distance: ' + Math.floor(totalDistance/10) + 'm';

resize();

function update(dt){
  if(!running) return;
  // player input
  let vx=0, vy=0;
  if(keys.ArrowUp || keys.w) vy -= 1;
  if(keys.ArrowDown || keys.s) vy += 1;
  if(keys.ArrowLeft || keys.a) vx -= 1;
  if(keys.ArrowRight || keys.d) vx += 1;
  const len = Math.hypot(vx,vy);
  if(len>0){ vx/=len; vy/=len; }
  player.x += vx * player.speed * dt;
  player.y += vy * player.speed * dt;
  player.x = clamp(player.x, player.r, W-player.r);
  player.y = clamp(player.y, player.r, H-player.r);

  // chaser AI: move toward player
  const dx = player.x - chaser.x;
  const dy = player.y - chaser.y;
  const d = Math.hypot(dx,dy) || 1;
  const nx = dx/d, ny = dy/d;
  chaser.x += nx * chaser.speed * dt;
  chaser.y += ny * chaser.speed * dt;

  // collision with chaser
  if(Math.hypot(player.x-chaser.x, player.y-chaser.y) < player.r + chaser.r){
    running = false;
    document.getElementById('status').textContent = 'Caught! Press Space to restart.';
    const sc = Math.floor(score);
    if(sc > high){ high = sc; localStorage.setItem('chase_highscore', String(high)); document.getElementById('highscore').textContent = 'High: ' + high; }
  }

  // background scroll and scoring
  bgOffset += scrollSpeed * dt;
  score += dt * 10; // score increases over time
  document.getElementById('score').textContent = 'Score: ' + Math.floor(score);

  // distance calculation
  const distLeft = Math.max(0, Math.floor((totalDistance - bgOffset) / 10)); // show in meters
  document.getElementById('distance').textContent = 'Distance: ' + distLeft + 'm';
  if(distLeft <= 0){
    running = false;
    document.getElementById('status').textContent = 'You reached the destination! Press Space to play again.';
    // award bonus score
    score += 100 * Math.max(1, Math.floor((Math.min(6, 1 + Math.floor(score/50)))));
    const sc = Math.floor(score);
    if(sc > high){ high = sc; localStorage.setItem('chase_highscore', String(high)); document.getElementById('highscore').textContent = 'High: ' + high; }
    return;
  }

  // determine path dimensions for rules
  const pathW = Math.min(600, W*0.6);
  const pathX = (W - pathW)/2;

  // crosswalk positions (vertical positions) - based on bgOffset so they scroll
  const crossPositions = [];
  const start = - (bgOffset % crossSpacing) - crossSpacing;
  for(let y = start; y < H + crossSpacing; y += crossSpacing) crossPositions.push(y + crossSpacing);

  // check if player is off the path and not on a crosswalk -> foul
  const onPath = (player.x >= pathX + player.r) && (player.x <= pathX + pathW - player.r);
  let onCross = false;
  for(const cy of crossPositions){ if(Math.abs(player.y - cy) < crossHeight/2) { onCross = true; break; } }
  if(!onPath && !onCross){
    running = false;
    document.getElementById('status').textContent = 'Foul! Off the path. Press Space to restart.';
    const sc = Math.floor(score);
    if(sc > high){ high = sc; localStorage.setItem('chase_highscore', String(high)); document.getElementById('highscore').textContent = 'High: ' + high; }
    return;
  }

  // stage progression affects chaser speed and vehicle spawn
  const stage = Math.min(6, 1 + Math.floor(score / 50));
  chaser.speed = baseChaserSpeed + (stage - 1) * 18;

  // vehicles spawn logic
  spawnTimer -= dt;
  const spawnInterval = Math.max(0.5, spawnBase - (stage - 1) * 0.3);
  if(spawnTimer <= 0){
    spawnTimer = spawnInterval * (0.7 + Math.random() * 0.6);
    // spawn vehicle crossing the path at a random Y within screen
    const dir = Math.random() < 0.5 ? -1 : 1; // -1 from left->right, 1 from right->left
    const y = Math.random() * (H - 120) + 60;
    const vw = 50 + Math.random()*120; // varied widths
    const vh = 24 + Math.random()*40;  // varied heights
    const speed = 120 + stage * 30 + Math.random()*60;
    const x = dir === -1 ? -vw : W + vw;
    const color = Math.random() < 0.6 ? '#b33' : '#3b8';
    vehicles.push({x,y,w:vw,h:vh,vx: dir === -1 ? speed : -speed, color});
  }

  // update vehicles and check collisions
  for(let i = vehicles.length - 1; i >= 0; --i){
    const v = vehicles[i];
    v.x += v.vx * dt;
    // remove offscreen
    if(v.vx > 0 && v.x > W + 200) vehicles.splice(i,1);
    else if(v.vx < 0 && v.x < -200) vehicles.splice(i,1);
    // collision with player (rect vs circle)
    const dxv = Math.abs(v.x - player.x);
    const dyv = Math.abs(v.y - player.y);
    if(dxv < v.w/2 + player.r && dyv < v.h/2 + player.r){
      running = false;
      document.getElementById('status').textContent = 'Hit by vehicle! Press Space to restart.';
      const sc = Math.floor(score);
      if(sc > high){ high = sc; localStorage.setItem('chase_highscore', String(high)); document.getElementById('highscore').textContent = 'High: ' + high; }
      break;
    }
  }
}

function drawPlayer(x,y,r){
  // little boy: blue circle with a cap
  ctx.save();
  ctx.translate(x,y);
  // body
  ctx.fillStyle = '#4fb3ff'; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  // cap
  ctx.fillStyle = '#043a6b'; ctx.beginPath(); ctx.arc(-3,-r*0.2,r*0.5,Math.PI,2*Math.PI); ctx.fill();
  // eyes
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4,-2,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4,-2,2,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawMonster(x,y,r){
  // simple monster with teeth and eyes
  ctx.save();
  ctx.translate(x,y);
  // body
  const g = ctx.createRadialGradient(-r/3,-r/3,r/4,0,0,r);
  g.addColorStop(0,'#ff9b9b'); g.addColorStop(1,'#f33');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  // eyes
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6,-6,4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(6,-6,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-6,-6,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(6,-6,2,0,Math.PI*2); ctx.fill();
  // mouth/teeth
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(-8,2,16,6); ctx.fill();
  ctx.fillStyle = '#fff'; for(let i= -6;i<=6;i+=4) ctx.beginPath(), ctx.moveTo(i,2), ctx.lineTo(i+2,8), ctx.lineTo(i+4,2), ctx.fill();
  ctx.restore();
}

function draw(){
  // background
  ctx.clearRect(0,0,W,H);
  // path
  const pathW = Math.min(600, W*0.6);
  const pathX = (W - pathW)/2;
  ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0,0,W,H);
  // road with classic textures
  ctx.fillStyle = marginPattern; ctx.fillRect(0,0,pathX,H); ctx.fillRect(pathX+pathW,0,pathX,H);
  ctx.fillStyle = roadPattern; ctx.fillRect(pathX,0,pathW,H);
  // dashed center line (moving)
  const dashH = 30; const gap = 20; const spacing = dashH + gap;
  let yOff = -(bgOffset % spacing);
  ctx.fillStyle = '#f5e6b6';
  while(yOff < H){
    ctx.fillRect(pathX + pathW/2 - 6, yOff, 12, dashH);
    yOff += spacing;
  }

  // draw crosswalks (places where crossing is allowed)
  ctx.fillStyle = 'rgba(240,240,240,0.75)';
  const start = - (bgOffset % crossSpacing) - crossSpacing;
  for(let y = start; y < H + crossSpacing; y += crossSpacing){
    const cy = y + crossSpacing;
    const stripeW = pathW - 80;
    const sx = pathX + (pathW - stripeW)/2;
    const stripeH = 8;
    for(let i=0;i<6;i++){
      const xx = sx + i*(stripeW/6 + 6);
      ctx.fillRect(xx, cy - stripeH/2, stripeW/6, stripeH);
    }
  }

  // draw vehicles under entities (variable sizes/colors)
  for(const v of vehicles){
    ctx.save(); ctx.translate(v.x, v.y);
    ctx.fillStyle = v.color || '#b33'; ctx.fillRect(-v.w/2, -v.h/2, v.w, v.h);
    // faint vertical stripes for classic texture
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for(let sx = -v.w/2; sx < v.w/2; sx += 8) ctx.fillRect(sx, -v.h/2, 4, v.h);
    // wheels scaled to vehicle height
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-v.w/3, v.h/2 - Math.max(4, v.h/6), Math.max(4, v.h/6),0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(v.w/3, v.h/2 - Math.max(4, v.h/6), Math.max(4, v.h/6),0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // draw entities
  drawPlayer(player.x, player.y, player.r);
  drawMonster(chaser.x, chaser.y, chaser.r);

  // draw HUD stage
  const stage = Math.min(6, 1 + Math.floor(score / 50));
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W-140,10,130,40);
  ctx.fillStyle = '#fff'; ctx.font = '14px Arial'; ctx.fillText('Stage: ' + stage, W-130, 35);
}

function loop(ts){
  const dt = Math.min(0.05, (ts - last)/1000);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('keydown', e=>{
  if(e.code === 'Space'){
    if(!running){
      running = true;
      chaser.x = 100; chaser.y = 100;
      player.x = W/2; player.y = H/2;
      score = 0;
      bgOffset = 0;
      vehicles.length = 0;
      spawnTimer = 0;
      chaser.speed = baseChaserSpeed;
      document.getElementById('status').textContent = '';
      last = performance.now();
      document.getElementById('score').textContent = 'Score: 0';
      document.getElementById('distance').textContent = 'Distance: ' + Math.floor(totalDistance/10) + 'm';
    }
  }
});

// touch support: tap to set player position
canvas.addEventListener('touchstart', e=>{
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  player.x = t.clientX - rect.left; player.y = t.clientY - rect.top;
});
