(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const startScreen = document.getElementById('startScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const helpPanel = document.getElementById('helpPanel');
  const scoreEl = document.getElementById('score');
  const lengthEl = document.getElementById('lengthLabel');
  const boardEl = document.getElementById('leaderboard');
  const statusText = document.getElementById('statusText');
  const minimap = document.getElementById('minimap');
  const miniCtx = minimap.getContext('2d');
  const boostBar = document.getElementById('boostBar');
  const arenaStatus = document.getElementById('arenaStatus');
  const pauseScreen = document.getElementById('pauseScreen');
  let paused = false, boostEnergy = 100;
  const playerNameInput = document.getElementById('playerName');
  const TAU = Math.PI * 2;
  let W=0,H=0,dpr=1, running=false, lastTime=0, score=0, best=Number(localStorage.getItem('snakeArenaBest')||0);
  let player, foods=[], bots=[], camera={x:0,y:0}, mouse={x:0,y:0}, boosting=false, selectedColor='#53f59a', soundOn=true;
  const SKIN_COLORS={classic:'#53f59a',fire:'#ff7048',ice:'#65dfff',gold:'#ffd75a',galaxy:'#e36bff',dragon:'#ff8d37'};
  let equippedSkin=localStorage.getItem('snakeArenaEquippedSkin')||'classic';
  if(SKIN_COLORS[equippedSkin]) selectedColor=SKIN_COLORS[equippedSkin];
  const WORLD = 3200;
  const rand=(a,b)=>a+Math.random()*(b-a);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function resize(){
    const r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2);
    W=r.width; H=r.height; canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize',resize); resize();

  function makeSnake(name,color,x,y,isPlayer=false){
    const body=[]; for(let i=0;i<14;i++) body.push({x:x-i*8,y});
    return {name,color,x,y,angle:rand(0,TAU),body,targetLength:isPlayer?22:Math.floor(rand(15,31)),isPlayer,speed:isPlayer?145:rand(80,115),alive:true,turn:0};
  }
  function seedWorld(){
    foods=[];
    for(let i=0;i<360;i++) foods.push(makeFood(rand(-WORLD/2,WORLD/2),rand(-WORLD/2,WORLD/2)));
    bots=[];
    const names=['Neon','Turbo','Misket','Pofuduk','Zıpzıp','Lazer','Boncuk','Fırtına','Pixel','Kivi','Maviş','Kıvılcım'];
    const colors=['#ffbf4a','#43c6ff','#ff5bc8','#a98bff','#ff6f61','#e5f75a','#5de0d5'];
    for(let i=0;i<names.length;i++) bots.push(makeSnake(names[i],colors[i%colors.length],rand(-WORLD/2,WORLD/2),rand(-WORLD/2,WORLD/2)));
  }
  function makeFood(x,y,value=1){
    const colors=['#ffcf5c','#61f7b2','#5bd5ff','#ff70c8','#b29aff'];
    return {x,y,r:rand(3,6),color:colors[Math.floor(Math.random()*colors.length)],value};
  }
  function startGame(){
    score=0; running=true; paused=false; boosting=false; boostEnergy=100;
    pauseScreen.classList.add('hidden');
    document.getElementById('pauseBtn').textContent='Ⅱ Duraklat';
    arenaStatus.textContent='ARENA AKTİF';
    seedWorld();
    player=makeSnake((playerNameInput.value.trim()||'Oyuncu').slice(0,16),selectedColor,0,0,true);
    player.body=[]; for(let i=0;i<24;i++) player.body.push({x:-i*7,y:0});
    player.targetLength=24;
    camera.x=player.x; camera.y=player.y;
    mouse.x=W*.7; mouse.y=H*.5;
    startScreen.classList.add('hidden'); gameOverScreen.classList.add('hidden'); helpPanel.classList.add('hidden');
    scoreEl.textContent='0'; statusText.textContent='Yemleri topla ve büyü!';
    lastTime=performance.now();
  }
  function endGame(){
    running=false; boosting=false;
    document.getElementById('finalScore').textContent=score;
    if(score>best){best=score;localStorage.setItem('snakeArenaBest',String(best));}
    document.getElementById('bestScoreText').textContent='En iyi skorun: '+best;
    gameOverScreen.classList.remove('hidden');
  }
  function setMouse(e){
    const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top;
  }
  canvas.addEventListener('pointermove',setMouse);
  canvas.addEventListener('pointerdown',()=>{boosting=true;});
  window.addEventListener('pointerup',()=>boosting=false);
  function togglePause(force){
    if(!running)return;
    paused = typeof force === 'boolean' ? force : !paused;
    pauseScreen.classList.toggle('hidden',!paused);
    document.getElementById('pauseBtn').textContent=paused?'▶ Devam et':'Ⅱ Duraklat';
    arenaStatus.textContent=paused?'DURAKLATILDI':'ARENA AKTİF';
    if(paused)boosting=false;
  }
  document.getElementById('pauseBtn').addEventListener('click',()=>togglePause());
  document.getElementById('resumeBtn').addEventListener('click',()=>togglePause(false));
  document.getElementById('pauseMenuBtn').addEventListener('click',()=>{
    paused=false;running=false;pauseScreen.classList.add('hidden');startScreen.classList.remove('hidden');
    document.getElementById('pauseBtn').textContent='Ⅱ Duraklat';arenaStatus.textContent='MENÜ';
  });
  window.addEventListener('keydown',e=>{
    if(e.code==='Space'){e.preventDefault();boosting=true;}
    if(e.code==='Escape'||e.code==='KeyP')togglePause();
  });
  window.addEventListener('keyup',e=>{if(e.code==='Space')boosting=false;});
  document.getElementById('playBtn').addEventListener('click',startGame);
  document.getElementById('againBtn').addEventListener('click',startGame);
  document.getElementById('menuBtn').addEventListener('click',()=>{gameOverScreen.classList.add('hidden');startScreen.classList.remove('hidden');});
  document.getElementById('helpBtn').addEventListener('click',()=>helpPanel.classList.toggle('hidden'));
  document.getElementById('closeHelp').addEventListener('click',()=>helpPanel.classList.add('hidden'));
  document.getElementById('soundBtn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.textContent=soundOn?'🔊 Ses açık':'🔇 Ses kapalı';});
  document.querySelectorAll('.skin').forEach(btn=>{
    btn.classList.toggle('selected',btn.dataset.skin===selectedColor);
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.skin').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');selectedColor=btn.dataset.skin;
      equippedSkin=Object.keys(SKIN_COLORS).find(id=>SKIN_COLORS[id]===selectedColor)||'classic';
      localStorage.setItem('snakeArenaEquippedSkin',equippedSkin);
    });
  });


  // Storefront UI. Real-money checkout is intentionally disabled until a verified server checkout is configured.
  const shopScreen=document.getElementById('shopScreen');
  const shopNotice=document.getElementById('shopNotice');
  let ownedList;
  try { ownedList=JSON.parse(localStorage.getItem('snakeArenaOwnedSkins')||'["classic"]'); } catch { ownedList=['classic']; }
  const ownedSkins=new Set(Array.isArray(ownedList)?ownedList:['classic']);
  document.getElementById('shopBtn').addEventListener('click',()=>{shopScreen.classList.remove('hidden');renderShopButtons();});
  document.getElementById('closeShop').addEventListener('click',()=>shopScreen.classList.add('hidden'));
  document.getElementById('backToGame').addEventListener('click',()=>shopScreen.classList.add('hidden'));
  shopScreen.addEventListener('click',e=>{if(e.target===shopScreen)shopScreen.classList.add('hidden');});
  function renderShopButtons(){
    document.querySelectorAll('.buy-skin').forEach(btn=>{
      const owned=ownedSkins.has(btn.dataset.id);
      btn.textContent=owned?'Kullan':'Satın al';
      btn.disabled=false;
      if(owned)btn.classList.add('owned');else btn.classList.remove('owned');
    });
  }
  document.querySelectorAll('.buy-skin').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.id;
    if(ownedSkins.has(id)){
      equippedSkin=id;selectedColor=SKIN_COLORS[id]||'#53f59a';
      localStorage.setItem('snakeArenaEquippedSkin',id);
      document.querySelectorAll('.skin').forEach(b=>b.classList.toggle('selected',b.dataset.skin===selectedColor));
      shopNotice.textContent=`${btn.dataset.name} seçildi. Bu tarayıcıdaki demo kostüm kaydıdır.`;
      shopScreen.classList.add('hidden');return;
    }
    shopNotice.textContent=`${btn.dataset.name} — ₺${btn.dataset.price}. Gerçek ödeme henüz bağlı değil; ücret alınmadı ve kostüm hesabına eklenmedi.`;
  }));
  document.querySelectorAll('.equip-skin').forEach(btn=>btn.addEventListener('click',()=>{
    const skinId=btn.dataset.id||'classic';
    if(!ownedSkins.has(skinId)){shopNotice.textContent='Bu kostüm hesabında bulunmuyor.';return;}
    equippedSkin=skinId;selectedColor=SKIN_COLORS[skinId]||btn.dataset.skin;
    localStorage.setItem('snakeArenaEquippedSkin',equippedSkin);
    document.querySelectorAll('.skin').forEach(b=>b.classList.toggle('selected',b.dataset.skin===selectedColor));
    shopNotice.textContent='Kostüm seçildi! Oyunda bu görünüm kullanılacak. (Bu tarayıcıdaki demo kaydıdır.)';
    shopScreen.classList.add('hidden');
  }));

  // A real purchase must be granted only by a server after verified payment.
  // Never add a paid skin to ownedSkins from client-side JavaScript alone.

  function updateSnake(s,dt){
    if(!s.alive)return;
    if(s.isPlayer){
      const targetAngle=Math.atan2(mouse.y-H/2,mouse.x-W/2);
      let diff=Math.atan2(Math.sin(targetAngle-s.angle),Math.cos(targetAngle-s.angle));
      s.angle+=clamp(diff,-3.1*dt,3.1*dt);
      const isBoost=boosting&&boostEnergy>0&&s.body.length>20;
      s.speed=isBoost?235:145;
      if(isBoost){boostEnergy=Math.max(0,boostEnergy-dt*24);if(Math.random()<dt*8){score=Math.max(0,score-1);if(s.targetLength>15)s.targetLength-=.08;}}
      else boostEnergy=Math.min(100,boostEnergy+dt*12);
      boostBar.style.width=boostEnergy+'%';
    }else{
      s.turn-=dt;
      if(s.turn<=0){s.angle+=rand(-1.5,1.5);s.turn=rand(.5,2.2);}
      const edge= WORLD/2-120;
      const toCenter=Math.atan2(-s.y,-s.x);
      let d=Math.atan2(Math.sin(toCenter-s.angle),Math.cos(toCenter-s.angle));
      if(Math.abs(s.x)>edge||Math.abs(s.y)>edge)s.angle+=clamp(d,-2*dt,2*dt);
      s.speed=90;
    }
    s.x+=Math.cos(s.angle)*s.speed*dt;s.y+=Math.sin(s.angle)*s.speed*dt;
    s.x=clamp(s.x,-WORLD/2+10,WORLD/2-10);s.y=clamp(s.y,-WORLD/2+10,WORLD/2-10);
    s.body.unshift({x:s.x,y:s.y});
    const wanted=Math.max(12,Math.floor(s.targetLength));
    while(s.body.length>wanted)s.body.pop();
  }
  function eatFood(s){
    for(let i=foods.length-1;i>=0;i--){
      if(Math.hypot(s.x-foods[i].x,s.y-foods[i].y)<17+foods[i].r){
        const f=foods[i];foods.splice(i,1);
        s.targetLength+=f.value*1.3;
        if(s.isPlayer){score+=Math.round(f.value*10);scoreEl.textContent=score;lengthEl.textContent='Uzunluk: '+Math.floor(s.targetLength);statusText.textContent='Harika! Büyümeye devam et.';}
        if(foods.length<420)foods.push(makeFood(rand(-WORLD/2,WORLD/2),rand(-WORLD/2,WORLD/2)));
        if(soundOn) blip(450+Math.random()*400,.035);
      }
    }
  }
  let audioCtx=null;
  function blip(freq,duration){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=.025;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.stop(audioCtx.currentTime+duration);}catch(e){}}
  function checkCollisions(){
    const all=bots.filter(b=>b.alive);
    for(const b of all){
      if(dist(player,b)<18){endGame();return;}
      for(let i=8;i<b.body.length;i+=2){
        if(Math.hypot(player.x-b.body[i].x,player.y-b.body[i].y)<12){endGame();return;}
      }
    }
    for(const b of all){
      for(let i=8;i<player.body.length;i+=3){
        if(Math.hypot(b.x-player.body[i].x,b.y-player.body[i].y)<11){
          b.alive=false;
          for(let j=0;j<b.body.length;j+=3)foods.push(makeFood(b.body[j].x+rand(-8,8),b.body[j].y+rand(-8,8),2));
          break;
        }
      }
      if(!b.alive)continue;
      for(const other of all){
        if(other===b)continue;
        if(Math.hypot(b.x-other.x,b.y-other.y)<13){b.alive=false;for(let j=0;j<b.body.length;j+=4)foods.push(makeFood(b.body[j].x,b.body[j].y,2));break;}
      }
    }
  }
  function drawGrid(){
    ctx.fillStyle='#08131d';ctx.fillRect(0,0,W,H);
    const grid=50, left=camera.x-W/2,top=camera.y-H/2;
    ctx.strokeStyle='#132532';ctx.lineWidth=1;
    const sx=-((left%grid)+grid)%grid,sy=-((top%grid)+grid)%grid;
    ctx.beginPath();for(let x=sx;x<W;x+=grid){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=sy;y<H;y+=grid){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();
    const bx=-WORLD/2-camera.x+W/2,by=-WORLD/2-camera.y+H/2;
    ctx.strokeStyle='#274253';ctx.lineWidth=4;ctx.strokeRect(bx,by,WORLD,WORLD);
  }
  function worldToScreen(x,y){return{x:x-camera.x+W/2,y:y-camera.y+H/2};}
  function drawFood(f){
    const p=worldToScreen(f.x,f.y);if(p.x<-20||p.x>W+20||p.y<-20||p.y>H+20)return;
    ctx.save();ctx.shadowColor=f.color;ctx.shadowBlur=12;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(p.x,p.y,f.r,0,TAU);ctx.fill();ctx.restore();
    ctx.fillStyle='#ffffff88';ctx.beginPath();ctx.arc(p.x-f.r*.25,p.y-f.r*.25,Math.max(1,f.r*.25),0,TAU);ctx.fill();
  }
  function drawSnake(s){
    if(!s.alive||!s.body.length)return;
    // Draw tail first, then head.
    for(let i=s.body.length-1;i>=0;i--){
      const p=worldToScreen(s.body[i].x,s.body[i].y);
      if(p.x<-40||p.x>W+40||p.y<-40||p.y>H+40)continue;
      const r=8.3*(1-i/s.body.length*.18);
      ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();
      if(i%3===0){ctx.fillStyle='#ffffff18';ctx.beginPath();ctx.arc(p.x-2,p.y-2,r*.45,0,TAU);ctx.fill();}
    }
    const head=worldToScreen(s.x,s.y);
    ctx.save();ctx.shadowColor=s.color;ctx.shadowBlur=s.isPlayer?15:7;
    ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(head.x,head.y,10,0,TAU);ctx.fill();ctx.restore();
    const eyeOffsetX=Math.cos(s.angle+Math.PI/2)*3.5,eyeOffsetY=Math.sin(s.angle+Math.PI/2)*3.5;
    for(const side of [-1,1]){
      const ex=head.x+Math.cos(s.angle)*4+eyeOffsetX*side,ey=head.y+Math.sin(s.angle)*4+eyeOffsetY*side;
      ctx.fillStyle='white';ctx.beginPath();ctx.arc(ex,ey,2.8,0,TAU);ctx.fill();
      ctx.fillStyle='#101923';ctx.beginPath();ctx.arc(ex+Math.cos(s.angle),ey+Math.sin(s.angle),1.35,0,TAU);ctx.fill();
    }
    if(!s.isPlayer){ctx.font='bold 10px Inter, sans-serif';ctx.textAlign='center';ctx.fillStyle='#e9f3fa';ctx.fillText(s.name,head.x,head.y-19);}
  }
  function updateBoard(){
    const entries=[{name:player?.name||'Oyuncu',score:score,player:true},...bots.filter(b=>b.alive).map(b=>({name:b.name,score:Math.floor(b.targetLength*10)}))].sort((a,b)=>b.score-a.score).slice(0,5);
    boardEl.innerHTML=entries.map((e,i)=>`<li><span>${i+1}. ${escapeHTML(e.name)}${e.player?' (Sen)':''}</span><b>${e.score}</b></li>`).join('');
  }
  function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function frame(now){
    const dt=Math.min(.035,(now-lastTime)/1000||0);lastTime=now;
    if(running && !paused){
      updateSnake(player,dt);bots.forEach(b=>updateSnake(b,dt));
      eatFood(player);bots.filter(b=>b.alive).forEach(eatFood);checkCollisions();
      camera.x+=(player.x-camera.x)*Math.min(1,dt*5);camera.y+=(player.y-camera.y)*Math.min(1,dt*5);
      updateBoard();
    }
    drawGrid();
    if(!paused || !running){
      foods.forEach(drawFood);
      bots.forEach(drawSnake);
    }
    if(player)drawSnake(player);
    drawMinimap();
    requestAnimationFrame(frame);
  }
  function drawMinimap(){
    if(!miniCtx)return;
    const mw=minimap.width,mh=minimap.height;
    miniCtx.clearRect(0,0,mw,mh);
    miniCtx.fillStyle='#09151d';miniCtx.fillRect(0,0,mw,mh);
    miniCtx.strokeStyle='#294252';miniCtx.lineWidth=1;miniCtx.strokeRect(1,1,mw-2,mh-2);
    const mapX=x=>(x+WORLD/2)/WORLD*mw, mapY=y=>(y+WORLD/2)/WORLD*mh;
    bots.forEach(b=>{if(!b.alive)return;miniCtx.fillStyle=b.color;miniCtx.beginPath();miniCtx.arc(mapX(b.x),mapY(b.y),2.2,0,TAU);miniCtx.fill();});
    if(player){miniCtx.fillStyle=player.color;miniCtx.shadowColor=player.color;miniCtx.shadowBlur=5;miniCtx.beginPath();miniCtx.arc(mapX(player.x),mapY(player.y),3.8,0,TAU);miniCtx.fill();miniCtx.shadowBlur=0;}
    miniCtx.strokeStyle='#ffffff55';miniCtx.lineWidth=1;
    const vw=Math.min(mw,W/WORLD*mw),vh=Math.min(mh,H/WORLD*mh);
    const vx=clamp(mapX(camera.x)-vw/2,0,mw-vw),vy=clamp(mapY(camera.y)-vh/2,0,mh-vh);
    miniCtx.strokeRect(vx,vy,vw,vh);
  }
  // Initial attractive background scene behind the menu.
  seedWorld();player=makeSnake('Oyuncu',selectedColor,0,0,true);
  for(let i=0;i<player.body.length;i++){player.body[i].x=-i*7;}
  camera.x=0;camera.y=0;
  requestAnimationFrame(frame);
})();