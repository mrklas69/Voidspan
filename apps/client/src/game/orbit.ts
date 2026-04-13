// Orbit animace — asteroidy obíhající hvězdu.
// Belt = prstenec kolem Teegardenovy hvězdy. Segment hráče stojí,
// asteroid je v jiné orbitě → jeho dráha prochází přes obrazovku jako oblouk.
//
// Vizualizace: hypotetická hvězda daleko pod canvasem (off-screen).
// Asteroid oběhne kruhovou dráhu; viditelná část = horní výsek oblouku přes
// mid zone. Současně rotuje kolem vlastní osy (Phaser tween angle).

import Phaser from "phaser";

// Kruhová dráha — střed hodně pod canvasem, viditelný je jen horní oblouk.
// Radius velký → asteroid se přes šířku canvasu pohybuje skoro horizontálně
// s jemným vrcholem uprostřed.
const ORBIT_RADIUS = 1400;
const ORBIT_DURATION_MS = 25000; // 25 s per oběh — asteroid cítitelně pluje
const SELF_ROTATION_MS = 9000;   // 9 s per otáčka kolem vlastní osy
const SCALE = 3;                 // 6×6 native → 18×18 rendered

// Vertikální offset od horního okraje mid zone — jak hluboko prochází vrchol.
const VERTICAL_OFFSET = 140;

export function createAsteroidOrbit(
  scene: Phaser.Scene,
  centerX: number,
  canvasH: number,
): void {
  if (!scene.textures.exists("asteroid2")) return;
  void canvasH;

  // Střed orbity je pod canvasem: vrchol oblouku = (centerX, VERTICAL_OFFSET).
  const orbitCenterY = VERTICAL_OFFSET + ORBIT_RADIUS;

  // Tři asteroidy v různých fázích → vždy něco na obrazovce.
  // Viditelný úsek oblouku je cca 240°–300° (270° = vrchol). Phase offsety
  // rozhodují, kde asteroid právě je na t∈[0,1].
  const phaseOffsets = [0.0, 0.33, 0.66];

  for (const phase of phaseOffsets) {
    spawnOrbiter(scene, centerX, orbitCenterY, phase);
  }
}

// Launch on demand — CommandButton v dolní paletě. Náhodný radius, duration,
// směr, scale → každý „výstřel" vypadá jinak. Později (P2+) volnější dráhy
// s možností poškodit pás.
export function launchRandomAsteroid(scene: Phaser.Scene, centerX: number): void {
  if (!scene.textures.exists("asteroid2")) return;

  // Náhodný radius v rozsahu, který drží oblouk nad segmentem (neproletí přes
  // segment sám — ten bude ovlivněn v P2+ s damage mechanikou).
  const radius = 900 + Math.random() * 900; // 900–1800
  const verticalOffset = 100 + Math.random() * 80; // 100–180 px pod horním okrajem
  const orbitCenterY = verticalOffset + radius;

  // Náhodný směr: true=clockwise (zprava doleva), false=counter-clockwise.
  const clockwise = Math.random() < 0.5;

  // Náhodná rychlost: 15–35 s per oběh.
  const duration = 15000 + Math.random() * 20000;

  // Náhodný scale 2–4×: různě vzdálené / různě velké asteroidy.
  const scale = 2 + Math.random() * 2;

  spawnOrbiterCustom(scene, centerX, orbitCenterY, radius, clockwise, duration, scale);
}

function spawnOrbiterCustom(
  scene: Phaser.Scene,
  orbitCenterX: number,
  orbitCenterY: number,
  radius: number,
  clockwise: boolean,
  duration: number,
  scale: number,
): void {
  // CCW start 240° → 600° (stejné jako default).
  // CW start 300° → -60° (záporně = po směru hodinových ručiček v matematické konvenci).
  const start = clockwise ? 300 : 240;
  const end = clockwise ? -60 : 600;
  const ellipse = new Phaser.Curves.Ellipse(
    orbitCenterX,
    orbitCenterY,
    radius,
    radius,
    start,
    end,
    clockwise,
  );
  const path = new Phaser.Curves.Path();
  path.add(ellipse);

  const startPoint = path.getPoint(0);
  if (!startPoint) return;
  const follower = scene.add.follower(path, startPoint.x, startPoint.y, "asteroid2");
  follower.setOrigin(0.5, 0.5);
  follower.setScale(scale);
  follower.setDepth(-5);

  follower.startFollow({
    duration,
    repeat: -1,
    rotateToPath: false,
  });

  // Self-spin: 6–12 s, opět random.
  scene.tweens.add({
    targets: follower,
    angle: clockwise ? -360 : 360,
    duration: 6000 + Math.random() * 6000,
    repeat: -1,
    ease: "Linear",
  });
}

function spawnOrbiter(
  scene: Phaser.Scene,
  orbitCenterX: number,
  orbitCenterY: number,
  phaseOffset: number,
): void {
  // Ellipse: start 240° (visible left entry), end 600° (= 240+360, full oběh).
  // Vrchol oblouku je na 270° = 1/12 cesty od startu.
  const ellipse = new Phaser.Curves.Ellipse(
    orbitCenterX,
    orbitCenterY,
    ORBIT_RADIUS,
    ORBIT_RADIUS,
    240,
    600,
    false,
  );
  const path = new Phaser.Curves.Path();
  path.add(ellipse);

  // Start position dle phase — vypočteme t a odpovídající bod na path.
  const startPoint = path.getPoint(phaseOffset);
  if (!startPoint) return;

  const follower = scene.add.follower(path, startPoint.x, startPoint.y, "asteroid2");
  follower.setOrigin(0.5, 0.5);
  follower.setScale(SCALE);
  follower.setDepth(-5); // nad hvězdami, pod segmentem

  follower.startFollow({
    duration: ORBIT_DURATION_MS,
    repeat: -1,
    rotateToPath: false,
    startAt: phaseOffset, // klíčové: start v konkrétní fázi orbity
  });

  // Self-spin — asteroid rotuje kolem vlastní osy nezávisle na orbitě.
  scene.tweens.add({
    targets: follower,
    angle: 360,
    duration: SELF_ROTATION_MS,
    repeat: -1,
    ease: "Linear",
  });
}
