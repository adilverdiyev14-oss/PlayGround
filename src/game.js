import * as THREE from '../vendor/three.module.js';

const $=s=>document.querySelector(s), gameEl=$('#game');
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x080c0e); scene.fog=new THREE.FogExp2(0x080c0e,.037);
const camera=new THREE.PerspectiveCamera(73,innerWidth/innerHeight,.08,110); camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.8)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; gameEl.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x89949a,0x211c18,.38));
const moonLight=new THREE.DirectionalLight(0x89969a,.52);moonLight.position.set(-5,12,8);scene.add(moonLight);
const flashlight=new THREE.SpotLight(0xffe6bd,0,20,Math.PI/7,.42,1.4); flashlight.castShadow=false;scene.add(flashlight);scene.add(flashlight.target);
const mats={floor:new THREE.MeshStandardMaterial({color:0x343b38,roughness:.96}),wood:new THREE.MeshStandardMaterial({color:0x44332a,roughness:.9}),darkWood:new THREE.MeshStandardMaterial({color:0x201c1a,roughness:.95}),wall:new THREE.MeshStandardMaterial({color:0x343633,roughness:1}),plaster:new THREE.MeshStandardMaterial({color:0x777260,roughness:1}),paper:new THREE.MeshStandardMaterial({color:0xc2b99f,roughness:.8}),red:new THREE.MeshStandardMaterial({color:0x512a27,roughness:.85}),gold:new THREE.MeshStandardMaterial({color:0xc5a65f,roughness:.55,metalness:.3}),black:new THREE.MeshStandardMaterial({color:0x0b0c0d,roughness:.45}),stone:new THREE.MeshStandardMaterial({color:0x545650,roughness:1}),seal:new THREE.MeshStandardMaterial({color:0x9b332c,roughness:.62,emissive:0x47100d,emissiveIntensity:.3}),eye:new THREE.MeshBasicMaterial({color:0xf07543})};
const colliders=[], interactive=[], seals=[], lamps=[];
const boxGeo=new THREE.BoxGeometry(1,1,1);
function box(name,x,y,z,w,h,d,mat,collide=false,parent=scene){const m=new THREE.Mesh(boxGeo,mat);m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=h>1;m.receiveShadow=true;parent.add(m);if(collide&&h>.5)colliders.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2});return m}
function cylinder(x,y,z,r,h,mat,segments=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.88,r,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function pointLamp(x,y,z,color=0xe6a45e,intensity=1.5,range=7){const l=new THREE.PointLight(color,intensity,range,2);l.position.set(x,y,z);scene.add(l);const orb=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color}));orb.position.set(x,y,z);scene.add(orb);lamps.push({light:l,orb,base:intensity,phase:Math.random()*10});return l}
function seedWall(x,y,z,w,h,d,mat=mats.wall){box('wall',x,y,z,w,h,d,mat,true)}
function archway(z){
 // Sliding ribs leave a narrow, conspicuously dark threshold.
 seedWall(-2.8,1.75,z,2.4,3.5,.45,mats.darkWood);seedWall(2.8,1.75,z,2.4,3.5,.45,mats.darkWood);
 box('header',0,3.15,z,3.2,.7,.5,mats.darkWood,true);
 for(let x=-1.42;x<=1.43;x+=.24)box('paper screen',x,1.65,z+.19,.045,2.55,.06,mats.paper);
 box('lattice rail',0,.39,z+.12,3,.1,.18,mats.wood);box('lattice rail',0,2.91,z+.12,3,.1,.18,mats.wood);
}
function altar(x,z,index){
 box('altar stand',x,.55,z,1.5,.9,1.1,mats.darkWood,true);box('altar top',x,.99,z,1.8,.12,1.3,mats.red);
 for(let dx of [-.57,.57]){box('altar leg',x+dx,.27,z,.14,.5,.16,mats.wood);}
 box('offering box',x,.17,z+.88,.45,.28,.32,mats.red);
 for(let k=0;k<2;k++){const cx=x+(k?-.65:.65);cylinder(cx,1.19,z,.09,.3,mats.gold,8);pointLamp(cx,1.42,z,0xffb35d,.65,3);}
 const seal=new THREE.Group();seal.position.set(x,1.54,z-.12);scene.add(seal);
 const red=new THREE.Mesh(new THREE.PlaneGeometry(.72,.94),new THREE.MeshStandardMaterial({color:0xa62e28,roughness:.85,emissive:0x310806,emissiveIntensity:.55,side:THREE.DoubleSide}));seal.add(red);
 const rune=new THREE.Mesh(new THREE.BoxGeometry(.045,.5,.04),new THREE.MeshBasicMaterial({color:0xf2d6a5}));rune.position.z=.026;seal.add(rune);
 for(let n=0;n<3;n++){const h=new THREE.Mesh(new THREE.BoxGeometry(.27-n*.04,.025,.025),new THREE.MeshBasicMaterial({color:0xf2d6a5}));h.position.set(0,.18-n*.16,.03);seal.add(h)}
 const aura=new THREE.PointLight(0xb5382d,1.2,3);aura.position.set(x,1.8,z);scene.add(aura);
 const obj={kind:'seal',group:seal,aura,got:false,index,x,z,phase:Math.random()*6};interactive.push(obj);seals.push(obj);
}
function roomDecor(x,z,seed=0){
 // Folded paper charms, lanterns and beams create a handcrafted shrine corridor.
 for(let dx of [-2.7,2.7]){box('beam',x+dx,2.8,z, .16,5.6,.18,mats.darkWood);}
 box('beam',x,5.45,z,5.6,.25,.22,mats.darkWood);
 const lantern=box('lantern',x,2.65,z, .42,.62,.42,new THREE.MeshStandardMaterial({color:0x98633c,emissive:0x9b5122,emissiveIntensity:.55,roughness:.8}));
 box('lantern cap',x,3.01,z,.56,.08,.56,mats.darkWood);pointLamp(x,2.62,z,0xffa45b,.85,5);
 for(let i=0;i<5;i++){const px=x-1.6+i*.8;box('tatami seam',px,.018,z, .025,.025,4.2,mats.stone);}
}
function buildWorld(){
 // Continuous corridor floor, high walls, roof ribs and three offering alcoves.
 box('corridor floor',0,-.17,-27,8,.34,84,mats.floor,true);
 box('left wall',-4,2.4,-27,.42,4.8,84,mats.wall,true);
 // The right wall has three open doorways into the offering chambers.
 let wallEnd=15;
 for(const center of [-7.5,-28.2,-49.2]){const gap=1.55;const length=wallEnd-(center+gap);if(length>0)box('right wall',4,2.4,wallEnd-length/2,.42,4.8,length,mats.wall,true);wallEnd=center-gap;}
 if(wallEnd>-69)box('right wall',4,2.4,(-69+wallEnd)/2,.42,4.8,wallEnd+69,mats.wall,true);
 for(let z=12;z>=-69;z-=4){box('ceiling rib',0,4.7,z,7.8,.18,.22,mats.darkWood);}
 for(let z=10;z>=-66;z-=4){box('wall post',-3.72,2.35,z,.18,4.7,.2,mats.darkWood);box('wall post',3.72,2.35,z,.18,4.7,.2,mats.darkWood);}
 // Three threshold gates are passable; their shelves frame each chapter.
 [-14,-35,-56].forEach(z=>archway(z));
 // Side chambers with real openings in the corridor wall.
 const rooms=[{x:8.5,z:-7.5,id:0},{x:8.5,z:-28.2,id:1},{x:8.5,z:-49.2,id:2}];
 rooms.forEach(({x,z,id})=>{
   box('side chamber floor',8.5,-.17,z,9,.34,12,mats.floor,true);
   seedWall(13,2.3,z, .4,4.6,12,mats.wall);seedWall(8.5,2.3,z-6,9,4.6,.4,mats.wall);seedWall(8.5,2.3,z+6,9,4.6,.4,mats.wall);
   // Corridor-side wall is split around a 2.5m doorway.
   seedWall(4.05,2.3,z-3.7,.38,4.6,4.6,mats.wall);seedWall(4.05,2.3,z+3.7,.38,4.6,4.6,mats.wall);
   for(let xx=5.1;xx<=12.1;xx+=3.5){box('side post',xx,2.3,z-5.8,.16,4.6,.18,mats.darkWood);box('side post',xx,2.3,z+5.8,.16,4.6,.18,mats.darkWood)}
   box('chamber beam',8.5,4.5,z,8.7,.18,.2,mats.darkWood);roomDecor(8.5,z-2.6,id);
   altar(9.2,z+.5,id);
   for(let q=0;q<3;q++){const sx=5.2+q*2.7;const sz=z+(q%2?3:-3);box('stone lantern',sx,.37,sz,.55,.74,.55,mats.stone);pointLamp(sx,1.1,sz,0xffa85e,.45,3.5);}
 });
 // Final bell chamber, sealed until all talismans are returned.
 box('bell chamber floor',0,-.17,-73,8,.34,12,mats.floor,true);
 seedWall(-4,2.3,-73,.4,4.6,12,mats.wall);seedWall(4,2.3,-73,.4,4.6,12,mats.wall);seedWall(0,2.3,-79,8,4.6,.4,mats.wall);
 box('exit door',0,2,-67.1,3.1,4,.35,mats.red,true);box('door crossbar',0,3.3,-66.87,3.4,.15,.12,mats.gold);
 for(let x=-1.1;x<=1.1;x+=.35)box('door bars',x,2,-66.85,.045,3.5,.08,mats.darkWood);
 const bell=cylinder(0,4,-74,.62,.7,mats.gold,16);bell.rotation.z=Math.PI;
 box('bell beam',0,4.65,-74,3.8,.18,.25,mats.darkWood);pointLamp(0,3.4,-74,0xffa25a,1.6,8);
 // Mossy paving stones and discarded shrine paper along the path.
 for(let i=0;i<48;i++){const z=10-i*1.6;const x=(Math.sin(i*12.23)*2.65);const s=.35+Math.random()*.5;const tile=box('paving stone',x,.015,z,s,.05,.38,mats.stone);tile.rotation.y=(Math.random()-.5)*.12;}
 // Hanging prayer papers.
 for(let i=0;i<18;i++){const z=8-i*4.05;const side=i%2?1:-1;box('paper charm',side*3.35,2.3+Math.sin(i)*.45,z,.34,.57,.035,mats.paper);box('charm ink',side*3.35,2.3+Math.sin(i)*.45,z-.024,.04,.32,.012,mats.red);}
}
buildWorld();
// Placeholder removed; the three seals are created inside their shrine chambers.

// ---- First-person exploration and survival systems ----
const player={x:0,z:9,yaw:0,pitch:0,speed:3.25,oil:100,lantern:true};
const keys=new Set();let started=false,paused=false,ended=false,elapsed=0,toastTimer=0,damageCooldown=0,doorOpen=false,enemyAwake=false;
const doorMeshes=scene.children.filter(o=>o.name==='exit door'||o.name==='door crossbar'||o.name==='door bars');
const exitInteract={kind:'door',x:0,z:-67.1},bellInteract={kind:'bell',x:0,z:-74};interactive.push(exitInteract,bellInteract);
const enemy=new THREE.Group();enemy.position.set(0,0,-18);scene.add(enemy);
const enemyBody=new THREE.Mesh(new THREE.CapsuleGeometry(.43,1.25,4,8),new THREE.MeshStandardMaterial({color:0x101112,roughness:.48,metalness:.06}));enemyBody.position.y=1.08;enemy.add(enemyBody);
const enemyHead=new THREE.Mesh(new THREE.SphereGeometry(.39,12,10),mats.black);enemyHead.position.y=2.05;enemy.add(enemyHead);
const veil=new THREE.Mesh(new THREE.ConeGeometry(.64,.75,12,1,true),new THREE.MeshStandardMaterial({color:0x201c1a,side:THREE.DoubleSide,transparent:true,opacity:.8,roughness:1}));veil.position.set(0,1.8,.22);veil.rotation.x=Math.PI;enemy.add(veil);
for(const side of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),mats.eye);e.position.set(side*.14,2.1,-.34);enemy.add(e)}
enemy.visible=false;
const enemyLight=new THREE.PointLight(0x9b3024,1.5,4);enemyLight.position.set(0,1.8,0);enemy.add(enemyLight);
const objective=$('#objective'),prompt=$('#prompt'),toastEl=$('#toast'),hud=$('#hud'),hurtEl=$('#hurt');
function showToast(text,duration=2600){toastEl.textContent=text;toastEl.classList.add('show');toastTimer=duration/1000;}
function begin(){if(started)return;started=true;$('#titleScreen').classList.add('hide');hud.style.display='block';if(innerWidth>700&&renderer.domElement.requestPointerLock)renderer.domElement.requestPointerLock();showToast('The air tastes of rain and old incense.',4000);}
$('#startBtn').addEventListener('click',begin);
$('#againBtn').addEventListener('click',()=>location.reload());
$('#resumeBtn').addEventListener('click',()=>{paused=false;$('#pauseScreen').classList.add('hide');if(innerWidth>700)renderer.domElement.requestPointerLock?.()});
function pause(){if(!started||ended||paused)return;paused=true;$('#pauseScreen').classList.remove('hide');document.exitPointerLock?.()}
document.addEventListener('pointerlockchange',()=>{if(started&&!document.pointerLockElement&&innerWidth>700&&!paused&&!ended)pause()});
document.addEventListener('mousemove',e=>{if(!started||paused||ended||document.pointerLockElement!==renderer.domElement)return;player.yaw-=e.movementX*.0022;player.pitch=Math.max(-1.32,Math.min(1.32,player.pitch-e.movementY*.0022));});
renderer.domElement.addEventListener('click',()=>{if(started&&!paused&&!ended&&innerWidth>700&&!document.pointerLockElement)renderer.domElement.requestPointerLock?.()});
window.addEventListener('keydown',e=>{keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyE'||e.code==='Enter')interact();if(e.code==='KeyF')toggleLantern();if(e.code==='Escape'&&started&&!paused)pause();});
window.addEventListener('keyup',e=>keys.delete(e.code));
function toggleLantern(){if(!started||ended||paused)return;if(player.oil<=0){showToast('The lantern has run dry.',1800);return}player.lantern=!player.lantern;showToast(player.lantern?'The lantern wakes.':'Darkness closes around you.',1200)}
$('#lightBtn').addEventListener('pointerdown',e=>{e.preventDefault();toggleLantern()});$('#useBtn').addEventListener('pointerdown',e=>{e.preventDefault();interact()});
const runBtn=$('#runBtn');runBtn.addEventListener('pointerdown',e=>{e.preventDefault();runBtn.dataset.down='1'});for(const n of ['pointerup','pointercancel','pointerleave'])runBtn.addEventListener(n,()=>delete runBtn.dataset.down);
let stickPointer=null,stickVec={x:0,y:0};const stick=$('#stick');
stick.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e)});
stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e)});
function updateStick(e){const r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.max(1,Math.hypot(dx,dy)),limit=38;stickVec={x:dx/Math.max(m,limit),y:dy/Math.max(m,limit)}}
for(const n of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(n,()=>{stickPointer=null;stickVec={x:0,y:0}});
let lookPointer=null,lastTouch={x:0,y:0};renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){lookPointer=e.pointerId;lastTouch={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)}});
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&lookPointer===e.pointerId&&started&&!paused){player.yaw-=(e.clientX-lastTouch.x)*.006;player.pitch=Math.max(-1.32,Math.min(1.32,player.pitch-(e.clientY-lastTouch.y)*.006));lastTouch={x:e.clientX,y:e.clientY}}});
renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerId===lookPointer)lookPointer=null});
function pointInside(x,z,c,r=.32){return x+r>c.x1&&x-r<c.x2&&z+r>c.z1&&z-r<c.z2}
function blocked(x,z){return colliders.some(c=>pointInside(x,z,c))}
function movePlayer(dx,dz){let nx=player.x+dx;if(!blocked(nx,player.z))player.x=nx;let nz=player.z+dz;if(!blocked(player.x,nz))player.z=nz;player.x=Math.max(-3.52,Math.min(12.48,player.x));player.z=Math.max(-78.4,Math.min(11.9,player.z));}
function nearObj(o){return Math.hypot(player.x-o.x,player.z-o.z)<(o.kind==='door'?3.2:o.kind==='bell'?2.8:2.55)}
function interact(){if(!started||paused||ended)return;const candidates=interactive.filter(o=>!o.got&&(!o.kind||o.kind==='seal'||o.kind==='door'&&!doorOpen||o.kind==='bell'&&doorOpen)&&nearObj(o)).sort((a,b)=>Math.hypot(player.x-a.x,player.z-a.z)-Math.hypot(player.x-b.x,player.z-b.z));const o=candidates[0];if(!o){showToast('Only the rain answers.',1200);return}
 if(o.kind==='seal'){o.got=true;o.group.visible=false;o.aura.visible=false;$('#items').textContent=`SEALS   ${seals.filter(s=>s.got).length} / 3`;showToast(['The first ward warms your palm.','A second seal. Something stirs below.','The final ward is yours. The bell tower awaits.'][o.index],3300);if(!enemyAwake){enemyAwake=true;enemy.visible=true;$('#threat').textContent='SOMETHING HAS WOKEN';objective.textContent='Find the remaining warding seals';}if(seals.every(s=>s.got)){objective.textContent='Reach the bell tower and ring the bell';$('#threat').textContent='IT IS FOLLOWING YOU';}}
 else if(o.kind==='door'){if(!seals.every(s=>s.got)){const left=3-seals.filter(s=>s.got).length;showToast(`The vermilion door is bound. ${left} seal${left===1?'':'s'} remain.`,2600);return}doorOpen=true;doorMeshes.forEach(m=>scene.remove(m));for(let i=colliders.length-1;i>=0;i--)if(colliders[i].z1<-66.8&&colliders[i].z2>-67.5&&colliders[i].x1<2)colliders.splice(i,1);showToast('The seal breaks. The bell waits in the dark.',3200);objective.textContent='Ring the hollow bell';}
 else if(o.kind==='bell'){ended=true;document.exitPointerLock?.();$('#endTitle').textContent='The bell is silent.';$('#endText').textContent='At sunrise, Kuroi village remembers your name. You carried the last ward home.';$('#endScreen').classList.remove('hide');}
}
function tick(dt,t){if(!started||paused||ended)return;elapsed+=dt;if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toastEl.classList.remove('show')}
 const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stickVec.y;
 const r=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stickVec.x;
 const mag=Math.hypot(f,r)||1,sprint=keys.has('ShiftLeft')||keys.has('ShiftRight')||runBtn.dataset.down==='1',speed=player.speed*(sprint?1.52:1);
 const dx=(-Math.sin(player.yaw)*f+Math.cos(player.yaw)*r)/mag*speed*dt,dz=(-Math.cos(player.yaw)*f-Math.sin(player.yaw)*r)/mag*speed*dt;movePlayer(dx,dz);
 if(player.lantern&&player.oil>0)player.oil=Math.max(0,player.oil-dt*.42);$('#battery').style.width=`${player.oil}%`;if(player.oil<=0&&player.lantern)player.lantern=false;
 camera.position.set(player.x,1.65+Math.sin(elapsed*8)*Math.min(.025,Math.hypot(dx,dz)*.055),player.z);camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
 const look=new THREE.Vector3(-Math.sin(player.yaw)*Math.cos(player.pitch),Math.sin(player.pitch),-Math.cos(player.yaw)*Math.cos(player.pitch));flashlight.position.copy(camera.position);flashlight.target.position.copy(camera.position).add(look);flashlight.intensity=player.lantern&&player.oil>0?2.45:0;
 let target=null,best=Infinity;for(const o of interactive){if(o.got||o.kind==='door'&&doorOpen||o.kind==='bell'&&!doorOpen)continue;const d=Math.hypot(player.x-o.x,player.z-o.z);if(d<best&&nearObj(o)){best=d;target=o}}
 prompt.style.opacity=target?'1':'0';if(target)prompt.textContent=target.kind==='seal'?'[ E ]  TAKE THE WARDING SEAL':target.kind==='door'?'[ E ]  EXAMINE THE VERMILION DOOR':'[ E ]  RING THE HOLLOW BELL';
 lamps.forEach(({light,orb,base,phase})=>{const flicker=.88+Math.sin(t*7+phase)*.07+Math.sin(t*19+phase)*.035;light.intensity=base*flicker;orb.scale.setScalar(.9+flicker*.1)});
 seals.forEach(s=>{if(!s.got){s.group.position.y=1.54+Math.sin(t*1.7+s.phase)*.055;s.group.rotation.y=Math.sin(t*.6+s.phase)*.12;s.aura.intensity=.9+Math.sin(t*2+s.phase)*.25}});
 if(enemyAwake){const ex=enemy.position.x,ez=enemy.position.z;let tx=player.x,tz=player.z;if(player.x>4.1&&enemy.position.x<3.5){const room=seals.reduce((a,s)=>Math.abs(player.z-s.z)<Math.abs(player.z-a)?s.z:a,seals[0].z);tx=3.1;tz=room+(player.z<room?-1.35:1.35)}
  const vx=tx-ex,vz=tz-ez,d=Math.hypot(vx,vz),enemySpeed=1.24+Math.min(.5,seals.filter(s=>s.got).length*.15);if(d>.12){enemy.position.x+=vx/d*enemySpeed*dt;enemy.position.z+=vz/d*enemySpeed*dt}enemy.rotation.y=Math.atan2(vx,vz);enemyBody.position.y=1.08+Math.sin(t*6)*.035;
  const distance=Math.hypot(player.x-ex,player.z-ez);if(distance<12)$('#threat').textContent=distance<5?'IT IS RIGHT BEHIND YOU':'FOOTSTEPS IN THE SHRINE';else if(seals.filter(s=>s.got).length<3)$('#threat').textContent='SOMETHING IS FOLLOWING';
  if(distance<1.12&&damageCooldown<=0){damageCooldown=1.4;player.oil=Math.max(0,player.oil-14);hurtEl.classList.add('on');setTimeout(()=>hurtEl.classList.remove('on'),180);showToast('A cold hand closes around your shoulder.',1800);if(distance<.72){ended=true;document.exitPointerLock?.();$('#endTitle').textContent='The thirteenth ring.';$('#endText').textContent='The shrine kept what it was owed. Gather the seals again, and do not let it catch you.';$('#endScreen').classList.remove('hide')}}else damageCooldown=Math.max(0,damageCooldown-dt);
 }
}
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime;tick(dt,t);renderer.render(scene,camera)}frame();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight)});

