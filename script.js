// ===========================================
//  Audio Engine (Web Audio API - 全て合成)
// ===========================================
class SoundEngine {
constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
    this.masterGain = null;
    this.walkToggle = false;  // 左右の足を交互に
    this.bgmNodes = null;
}

init() {
    if (this.initialized) return;
    try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
    } catch(e) {
        console.warn('Web Audio not supported');
        this.enabled = false;
    }
}

resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
}

toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
        this.stopBGM();
    } else if (this.initialized) {
        this.startBGM();
    }
    return this.enabled;
}

// --- 歩行音: テコテコ ---
playWalk() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;
    this.walkToggle = !this.walkToggle;

    // 柔らかい「コッ」「トッ」を交互に
    const freq = this.walkToggle ? 320 : 260;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.06);

    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.0;

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
}

// --- ブロック移動音: 軽い「シュッ」 ---
playMove() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
}

// --- 回転音: 「クルッ」 ---
playRotate() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
}

// --- ブロック配置音: 「カチッ」 ---
playLock() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;

    // 硬い衝突音 = ノイズバースト + 短い正弦波
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 2.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);

    // 付随する「カチ」のトーン
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.04);
    oscGain.gain.setValueAtTime(0.1, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
}

// --- ハードドロップ音: 「ドスン」 ---
playHardDrop() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;

    // 低音のインパクト
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);

    // ノイズのアタック
    const bufLen = this.ctx.sampleRate * 0.08;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.1));
    }
    const ns = this.ctx.createBufferSource();
    ns.buffer = buf;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 800;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.25, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    ns.connect(nf);
    nf.connect(ng);
    ng.connect(this.masterGain);
    ns.start(t);
}

// --- 行消し音: 「シャリーン」 ---
playLineClear() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;

    const freqs = [800, 1000, 1200, 1500];
    freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, t + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, t + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.35);
    });
}

// --- 落下悲鳴: 「ウワァァァ〜」(下降する声のような音) ---
playScream() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;
    const duration = 1.6;

    // メインの「声」 - のこぎり波で声っぽく
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const formant1 = this.ctx.createBiquadFilter();
    const formant2 = this.ctx.createBiquadFilter();
    const formant3 = this.ctx.createBiquadFilter();

    // 基本周波数: 高い位置から下降（悲鳴→落ちていく感じ）
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(500, t);
    osc1.frequency.setValueAtTime(550, t + 0.05);  // 最初の叫びで少し上がる
    osc1.frequency.linearRampToValueAtTime(480, t + 0.3);
    osc1.frequency.linearRampToValueAtTime(300, t + 0.8);
    osc1.frequency.linearRampToValueAtTime(150, t + duration);

    // ビブラート
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(6, t);
    osc2.frequency.linearRampToValueAtTime(12, t + duration);
    gain2.gain.value = 15;
    osc2.connect(gain2);
    gain2.connect(osc1.frequency);

    // フォルマントフィルタ（母音 "ア" に近い音）
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(800, t);
    formant1.frequency.linearRampToValueAtTime(600, t + duration);
    formant1.Q.value = 5;

    formant2.type = 'bandpass';
    formant2.frequency.setValueAtTime(1200, t);
    formant2.frequency.linearRampToValueAtTime(900, t + duration);
    formant2.Q.value = 5;

    formant3.type = 'bandpass';
    formant3.frequency.value = 2500;
    formant3.Q.value = 3;

    // ミックス
    const mix = this.ctx.createGain();
    // エンベロープ: ぱっと始まり、だんだんフェードアウト
    mix.gain.setValueAtTime(0.0, t);
    mix.gain.linearRampToValueAtTime(0.25, t + 0.05);
    mix.gain.setValueAtTime(0.25, t + 0.3);
    mix.gain.linearRampToValueAtTime(0.15, t + 0.8);
    mix.gain.linearRampToValueAtTime(0.001, t + duration);

    // パラレルフォルマント
    const splitter = this.ctx.createGain();
    splitter.gain.value = 1.0;

    osc1.connect(splitter);
    splitter.connect(formant1);
    splitter.connect(formant2);
    splitter.connect(formant3);
    formant1.connect(mix);
    formant2.connect(mix);
    formant3.connect(mix);
    mix.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration + 0.1);
    osc2.stop(t + duration + 0.1);
}

// --- 成功ファンファーレ: 「パパパパーン!」 ---
playSuccess() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;

    const melody = [
        { f: 523, t: 0,    d: 0.15 }, // C5
        { f: 659, t: 0.15, d: 0.15 }, // E5
        { f: 784, t: 0.30, d: 0.15 }, // G5
        { f: 1047,t: 0.45, d: 0.4  }, // C6
    ];

    melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = note.f;

        gain.gain.setValueAtTime(0, t + note.t);
        gain.gain.linearRampToValueAtTime(0.15, t + note.t + 0.02);
        gain.gain.setValueAtTime(0.15, t + note.t + note.d * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.t + note.d);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + note.t);
        osc.stop(t + note.t + note.d + 0.05);
    });

    // キラキラ効果
    for (let i = 0; i < 6; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 2000 + Math.random() * 3000;
        const start = t + 0.5 + Math.random() * 0.5;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.05, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.2);
    }
}

// --- ゲームオーバー: 暗い下降音 ---
playGameOver() {
    if (!this.enabled || !this.initialized) return;
    const t = this.ctx.currentTime;

    const notes = [
        { f: 400, t: 0.0, d: 0.3 },
        { f: 350, t: 0.3, d: 0.3 },
        { f: 300, t: 0.6, d: 0.3 },
        { f: 200, t: 0.9, d: 0.6 },
    ];

    notes.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = note.f;
        gain.gain.setValueAtTime(0.15, t + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.t + note.d);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + note.t);
        osc.stop(t + note.t + note.d + 0.05);
    });
}

// --- BGM: ミニマルなループ ---
startBGM() {
    if (!this.enabled || !this.initialized) return;
    if (this.bgmNodes) return; // 既に再生中

    const t = this.ctx.currentTime;

    // シンプルなベースライン（ループ用にScriptProcessorの代わりにスケジューリング）
    this.bgmNodes = { running: true };
    this._scheduleBGMLoop(t);
}

_scheduleBGMLoop(startTime) {
    if (!this.bgmNodes || !this.bgmNodes.running) return;
    if (!this.enabled) return;

    const t = startTime;
    const bpm = 120;
    const beat = 60 / bpm;
    const bar = beat * 4;

    // ベースライン (C-E-G-E パターン)
    const bassNotes = [131, 165, 196, 165, 131, 165, 196, 220];
    const bassOscList = [];

    bassNotes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.value = f;
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gain.gain.setValueAtTime(0, t + i * beat * 0.5);
        gain.gain.linearRampToValueAtTime(0.07, t + i * beat * 0.5 + 0.02);
        gain.gain.setValueAtTime(0.07, t + i * beat * 0.5 + beat * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * beat * 0.5 + beat * 0.48);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + i * beat * 0.5);
        osc.stop(t + i * beat * 0.5 + beat * 0.5);
        bassOscList.push(osc);
    });

    // ハイハット風（軽いノイズ）
    for (let i = 0; i < 8; i++) {
        const bufLen = this.ctx.sampleRate * 0.03;
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < bufLen; j++) {
            d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufLen * 0.08));
        }
        const ns = this.ctx.createBufferSource();
        ns.buffer = buf;
        const hf = this.ctx.createBiquadFilter();
        hf.type = 'highpass';
        hf.frequency.value = 7000;
        const hg = this.ctx.createGain();
        hg.gain.setValueAtTime(0.03, t + i * beat * 0.5);
        hg.gain.exponentialRampToValueAtTime(0.001, t + i * beat * 0.5 + 0.04);
        ns.connect(hf);
        hf.connect(hg);
        hg.connect(this.masterGain);
        ns.start(t + i * beat * 0.5);
    }

    // 次のバーをスケジュール
    const loopDuration = bassNotes.length * beat * 0.5;
    const scheduleNext = () => {
        if (this.bgmNodes && this.bgmNodes.running && this.enabled) {
            this._scheduleBGMLoop(startTime + loopDuration);
        }
    };
    // 少し手前で次をスケジュール
    const delay = (loopDuration - 0.1) * 1000;
    this.bgmNodes.timer = setTimeout(scheduleNext, Math.max(delay, 100));
}

stopBGM() {
    if (this.bgmNodes) {
        this.bgmNodes.running = false;
        if (this.bgmNodes.timer) clearTimeout(this.bgmNodes.timer);
        this.bgmNodes = null;
    }
}
}

const sfx = new SoundEngine();


// ===========================================
//  Constants
// ===========================================
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');
const NEXT_CANVAS = document.getElementById('nextCanvas');
const NEXT_CTX = NEXT_CANVAS.getContext('2d');

const COLS = 30;
const ROWS = 20;
const VALLEY_LEFT = 10;
const VALLEY_RIGHT = 20;
const SURFACE_ROW = 14;

let CW, CH;

function resize() {
const cont = CANVAS.parentElement;
const w = cont.clientWidth;
const h = cont.clientHeight;
CANVAS.width = w * devicePixelRatio;
CANVAS.height = h * devicePixelRatio;
CANVAS.style.width = w + 'px';
CANVAS.style.height = h + 'px';
CTX.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
CW = w / COLS;
CH = h / ROWS;
}
resize();
window.addEventListener('resize', resize);

// ===========================================
//  Sprite-based Walking Character (4-frame)
// ===========================================
class WalkingCharacter {
constructor() {
    this.frames = [];
    this.currentFrame = 0;
    this.frameTick = 0;
    this.frameDelay = 8;
    this.ready = false;
    this._generateSprites();
}

_generateSprites() {
    const size = 128;
    const poses = [
        { lLeg: -25, rLeg: 20, lArm: 20, rArm: -15, bodyDip: 0 },
        { lLeg: -5,  rLeg: 5,  lArm: 5,  rArm: -5,  bodyDip: -2 },
        { lLeg: 20,  rLeg: -25, lArm: -15, rArm: 20, bodyDip: 0 },
        { lLeg: 5,   rLeg: -5, lArm: -5,  rArm: 5,  bodyDip: -2 },
    ];

    for (let i = 0; i < 4; i++) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const c = offCanvas.getContext('2d');
        this._drawPerson(c, size, poses[i]);
        this.frames.push(offCanvas);
    }
    this.ready = true;
}

_drawPerson(c, size, pose) {
    const cx = size / 2;
    const groundY = size - 8;
    const headR = 10;
    const neckY = 28;
    const shoulderY = 36;
    const hipY = 68 + pose.bodyDip;

    c.lineCap = 'round';
    c.lineJoin = 'round';

    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.beginPath();
    c.ellipse(cx, groundY + 2, 16, 4, 0, 0, Math.PI * 2);
    c.fill();

    this._drawLimb(c, cx, hipY, pose.rLeg, 28, 26, groundY, '#5D4037', 4.5, true);
    this._drawArmLimb(c, cx, shoulderY, pose.rArm, 20, 18, '#795548', 3.5);

    const gradient = c.createLinearGradient(cx - 8, shoulderY, cx + 8, hipY);
    gradient.addColorStop(0, '#2196F3');
    gradient.addColorStop(1, '#1565C0');
    c.fillStyle = gradient;
    c.beginPath();
    c.moveTo(cx - 8, shoulderY);
    c.lineTo(cx + 8, shoulderY);
    c.lineTo(cx + 7, hipY);
    c.lineTo(cx - 7, hipY);
    c.closePath();
    c.fill();

    c.fillStyle = '#37474F';
    c.fillRect(cx - 8, hipY - 4, 16, 5);

    c.fillStyle = '#FFCCBC';
    c.fillRect(cx - 3, neckY, 6, shoulderY - neckY + 2);

    c.fillStyle = '#4E342E';
    c.beginPath();
    c.arc(cx, neckY - 2, headR + 2, Math.PI, 0);
    c.fill();

    c.fillStyle = '#FFCCBC';
    c.beginPath();
    c.arc(cx, neckY - 2, headR, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#4E342E';
    c.beginPath();
    c.ellipse(cx, neckY - 9, headR + 1, 7, 0, Math.PI, 2 * Math.PI);
    c.fill();

    c.fillStyle = '#263238';
    c.beginPath();
    c.arc(cx + 4, neckY - 3, 1.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx + 4.8, neckY - 3.8, 0.7, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = '#BF360C';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(cx + 3, neckY + 2, 2.5, 0.1, Math.PI * 0.8);
    c.stroke();

    c.fillStyle = '#FFAB91';
    c.beginPath();
    c.arc(cx - 9, neckY - 2, 3, 0, Math.PI * 2);
    c.fill();

    this._drawLimb(c, cx, hipY, pose.lLeg, 28, 26, groundY, '#37474F', 5, false);
    this._drawArmLimb(c, cx, shoulderY, pose.lArm, 20, 18, '#FFCCBC', 4);
}

_drawLimb(c, cx, hipY, angleDeg, thighLen, shinLen, groundY, color, width, isBack) {
    const a = angleDeg * Math.PI / 180;
    const kneeX = cx + Math.sin(a) * thighLen;
    const kneeY = hipY + Math.cos(a) * thighLen;

    let shinA;
    if (angleDeg > 10) {
        shinA = -a * 0.3;
    } else if (angleDeg < -15) {
        shinA = a * 0.8;
    } else {
        shinA = 0;
    }

    const footX = kneeX + Math.sin(shinA) * shinLen;
    const footY = kneeY + Math.cos(shinA) * shinLen;

    const pantsColor = isBack ? '#455A64' : '#546E7A';
    c.strokeStyle = pantsColor;
    c.lineWidth = width + 1;
    c.beginPath();
    c.moveTo(cx, hipY);
    c.lineTo(kneeX, kneeY);
    c.stroke();

    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(kneeX, kneeY);
    c.lineTo(footX, footY);
    c.stroke();

    const shoeColor = isBack ? '#5D4037' : '#795548';
    c.fillStyle = shoeColor;
    c.beginPath();
    c.ellipse(footX + 3, footY + 1, 7, 4, -0.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3E2723';
    c.fillRect(footX - 3, footY + 3, 12, 2.5);
}

_drawArmLimb(c, cx, shoulderY, angleDeg, armLen, foreLen, color, width) {
    const a = angleDeg * Math.PI / 180;
    const elbowX = cx + Math.sin(a) * armLen;
    const elbowY = shoulderY + Math.cos(a) * armLen;

    const foreA = a * 1.5 + 0.3;
    const handX = elbowX + Math.sin(foreA) * foreLen;
    const handY = elbowY + Math.cos(foreA) * foreLen;

    c.strokeStyle = '#1976D2';
    c.lineWidth = width + 1;
    c.beginPath();
    c.moveTo(cx + (angleDeg > 0 ? 6 : -6), shoulderY + 2);
    c.lineTo(elbowX, elbowY);
    c.stroke();

    c.strokeStyle = color;
    c.lineWidth = width - 0.5;
    c.beginPath();
    c.moveTo(elbowX, elbowY);
    c.lineTo(handX, handY);
    c.stroke();

    c.fillStyle = '#FFCCBC';
    c.beginPath();
    c.arc(handX, handY, 2.8, 0, Math.PI * 2);
    c.fill();
}

update() {
    this.frameTick++;
    if (this.frameTick >= this.frameDelay) {
        this.frameTick = 0;
        this.currentFrame = (this.currentFrame + 1) % 4;
        return true;  // フレームが切り替わった
    }
    return false;
}

draw(ctx, x, y, w, h, flip) {
    if (!this.ready) return;
    ctx.save();
    if (flip) {
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.frames[this.currentFrame], 0, 0, w, h);
    } else {
        ctx.drawImage(this.frames[this.currentFrame], x, y, w, h);
    }
    ctx.restore();
}
}

// ===========================================
//  Falling character
// ===========================================
class FallingCharacter {
constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 128;
    this.canvas.height = 128;
    const c = this.canvas.getContext('2d');
    this._draw(c);
}
_draw(c) {
    const cx = 64, headR = 10;
    c.lineCap = 'round';
    c.fillStyle = '#1565C0';
    c.fillRect(cx - 8, 36, 16, 32);
    c.fillStyle = '#37474F';
    c.fillRect(cx - 8, 64, 16, 5);
    c.fillStyle = '#FFCCBC';
    c.fillRect(cx - 3, 28, 6, 10);
    c.fillStyle = '#FFCCBC';
    c.beginPath(); c.arc(cx, 22, headR, 0, Math.PI*2); c.fill();
    c.fillStyle = '#4E342E';
    c.beginPath(); c.ellipse(cx, 15, headR+1, 7, 0, Math.PI, 2*Math.PI); c.fill();
    c.fillStyle = '#263238';
    c.beginPath(); c.arc(cx+4, 20, 2.5, 0, Math.PI*2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx+4, 20, 1.2, 0, Math.PI*2); c.fill();
    c.fillStyle = '#263238';
    c.beginPath(); c.arc(cx+3, 26, 3, 0, Math.PI*2); c.fill();
    c.fillStyle = '#BF360C';
    c.beginPath(); c.arc(cx+3, 26, 2, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#1976D2'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(cx-8, 38); c.lineTo(cx-22, 18); c.stroke();
    c.beginPath(); c.moveTo(cx+8, 38); c.lineTo(cx+22, 18); c.stroke();
    c.strokeStyle = '#FFCCBC'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(cx-22, 18); c.lineTo(cx-26, 8); c.stroke();
    c.beginPath(); c.moveTo(cx+22, 18); c.lineTo(cx+26, 8); c.stroke();
    c.fillStyle = '#FFCCBC';
    c.beginPath(); c.arc(cx-26, 8, 3, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(cx+26, 8, 3, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#546E7A'; c.lineWidth = 5.5;
    c.beginPath(); c.moveTo(cx-5, 68); c.lineTo(cx-18, 92); c.stroke();
    c.beginPath(); c.moveTo(cx+5, 68); c.lineTo(cx+18, 92); c.stroke();
    c.strokeStyle = '#37474F'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(cx-18, 92); c.lineTo(cx-22, 112); c.stroke();
    c.beginPath(); c.moveTo(cx+18, 92); c.lineTo(cx+15, 112); c.stroke();
    c.fillStyle = '#795548';
    c.beginPath(); c.ellipse(cx-22, 114, 7, 4, 0.3, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(cx+15, 114, 7, 4, -0.3, 0, Math.PI*2); c.fill();
}
draw(ctx, x, y, w, h) {
    ctx.drawImage(this.canvas, x, y, w, h);
}
}

// ===========================================
//  Tetris Pieces
// ===========================================
const SHAPES = [
{ shape: [[1,1,1,1]], color: '#00BCD4', shadow: '#00838F' },
{ shape: [[1,1],[1,1]], color: '#FFC107', shadow: '#FFA000' },
{ shape: [[0,1,0],[1,1,1]], color: '#9C27B0', shadow: '#6A1B9A' },
{ shape: [[1,0,0],[1,1,1]], color: '#FF5722', shadow: '#D84315' },
{ shape: [[0,0,1],[1,1,1]], color: '#2196F3', shadow: '#1565C0' },
{ shape: [[0,1,1],[1,1,0]], color: '#4CAF50', shadow: '#2E7D32' },
{ shape: [[1,1,0],[0,1,1]], color: '#F44336', shadow: '#C62828' },
];

// ===========================================
//  Game State
// ===========================================
let grid = [];
let gridColors = [];
let currentPiece = null;
let nextPiece = null;
let walker = null;
let fallingChar = null;

let gameState = 'title';
let score = 0;
let level = 1;
let dropInterval = 50;
let dropTimer = 0;
let spawnTimer = 0;

let walkerX = 0;
let walkerY = 0;
let walkerSpeed = 0.012;
let walkerFalling = false;
let walkerFallVel = 0;
let walkerFallY = 0;
let screamPlayed = false;

let particles = [];

let clouds = [];
for (let i = 0; i < 6; i++) {
clouds.push({
    x: Math.random() * COLS * 2 - COLS * 0.3,
    y: Math.random() * 4 + 0.5,
    w: Math.random() * 4 + 3,
    speed: Math.random() * 0.003 + 0.001
});
}

// ===========================================
//  Init
// ===========================================
function initGrid() {
grid = [];
gridColors = [];
for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    gridColors[r] = [];
    for (let c = 0; c < COLS; c++) {
        if (r >= SURFACE_ROW && (c < VALLEY_LEFT || c >= VALLEY_RIGHT)) {
            grid[r][c] = 1;
            gridColors[r][c] = '#ground';
        } else {
            grid[r][c] = 0;
            gridColors[r][c] = null;
        }
    }
}
}

function createPiece() {
const idx = Math.floor(Math.random() * SHAPES.length);
const s = SHAPES[idx];
return {
    shape: s.shape.map(row => [...row]),
    color: s.color,
    shadow: s.shadow,
    x: Math.floor((VALLEY_LEFT + VALLEY_RIGHT) / 2) - Math.floor(s.shape[0].length / 2),
    y: 0
};
}

function initGame() {
initGrid();
score = 0;
level = 1;
dropInterval = 50;
walkerX = 0;
walkerY = SURFACE_ROW;
walkerFalling = false;
walkerFallVel = 0;
walkerFallY = 0;
walkerSpeed = 0.012;
screamPlayed = false;
particles = [];
currentPiece = createPiece();
nextPiece = createPiece();
dropTimer = 0;
spawnTimer = 0;
updateScoreDisplay();
updateNextDisplay();
}

// ===========================================
//  Piece Logic
// ===========================================
function canPlace(shape, px, py) {
for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
            const nx = px + c;
            const ny = py + r;
            if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
            if (ny >= 0 && grid[ny][nx] !== 0) return false;
        }
    }
}
return true;
}

function lockPiece(piece) {
for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
            const ny = piece.y + r;
            const nx = piece.x + c;
            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
                grid[ny][nx] = 2;
                gridColors[ny][nx] = piece.color;
            }
        }
    }
}
sfx.playLock();
Haptics.trigger('lock');
let cleared = checkRows();
score += 10;
if (cleared > 0) {
    sfx.playLineClear();
    Haptics.trigger('clear');
}
updateScoreDisplay();
}

function checkRows() {
let cleared = 0;
for (let r = SURFACE_ROW; r < ROWS; r++) {
    let full = true;
    for (let c = VALLEY_LEFT; c < VALLEY_RIGHT; c++) {
        if (grid[r][c] === 0) { full = false; break; }
    }
    if (full) {
        cleared++;
        score += 50 * level;
        for (let c = VALLEY_LEFT; c < VALLEY_RIGHT; c++) {
            for (let i = 0; i < 3; i++) {
                particles.push({
                    x: (c + 0.5) * CW,
                    y: r * CH,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 3 - 1,
                    life: 40,
                    color: gridColors[r][c] || '#FFC107'
                });
            }
        }
    }
}
return cleared;
}

function rotate(piece) {
const newShape = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
);
const kicks = [0, -1, 1, -2, 2];
for (const kick of kicks) {
    if (canPlace(newShape, piece.x + kick, piece.y)) {
        piece.shape = newShape;
        piece.x += kick;
        sfx.playRotate();
        return;
    }
}
}

function computeGhost(piece) {
let gy = piece.y;
while (canPlace(piece.shape, piece.x, gy + 1)) gy++;
return gy;
}

function hardDrop(piece) {
while (canPlace(piece.shape, piece.x, piece.y + 1)) {
    piece.y++;
}
sfx.playHardDrop();
lockPiece(piece);
spawnNext();
}

function spawnNext() {
currentPiece = nextPiece;
nextPiece = createPiece();
dropTimer = 0;
updateNextDisplay();
}

function movePiece(dx, dy) {
if (!currentPiece || gameState !== 'playing') return false;
if (canPlace(currentPiece.shape, currentPiece.x + dx, currentPiece.y + dy)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    sfx.playMove();
    return true;
}
return false;
}

// ===========================================
//  Walker Logic
// ===========================================
function getGroundY(col) {
const c = Math.floor(col);
if (c < 0 || c >= COLS) return SURFACE_ROW;
for (let r = 0; r < ROWS; r++) {
    if (grid[r][c] !== 0) return r;
}
return ROWS;
}

function canWalkerWalk(x) {
const col = Math.floor(x);
if (col < 0) return true;
if (col >= COLS) return true;
if (col >= VALLEY_LEFT && col < VALLEY_RIGHT) {
    const groundRow = getGroundY(col);
    if (groundRow > SURFACE_ROW) return false;

    // 沈むピット: 橋（置かれたブロック）には“厚み”が必要
    // Lv2: 中心は depth=2、端は depth=3（= 上から1段 / 2段分必要）
    // Lv3+: 中心は depth=3、端は depth=4（= 上から2段 / 3段分必要）
    let centerExtra = 0;
    let edgeExtra = 0;
    if (level === 2) {
        centerExtra = 1;
        edgeExtra = 2;
    } else if (level >= 3) {
        centerExtra = 2;
        edgeExtra = 3;
    }

    const edgeMargin = 2; // 谷端から何列を“より深い”扱いにするか
    const isEdge = (col < VALLEY_LEFT + edgeMargin) || (col >= VALLEY_RIGHT - edgeMargin);
    const requiredExtra = isEdge ? edgeExtra : centerExtra;
    const requiredDepth = 1 + requiredExtra;

    // 最上段（groundRow）から下に requiredDepth 分、連続して埋まっていないと渡れない
    for (let i = 0; i < requiredDepth; i++) {
        const r = groundRow + i;
        if (r >= ROWS) return false;
        if (grid[r][col] === 0) return false;
    }
    return true;
}
return true;
}

// ===========================================
//  Drawing - Background
// ===========================================
function drawBackground() {
const w = CANVAS.width / devicePixelRatio;
const h = CANVAS.height / devicePixelRatio;

const skyGrad = CTX.createLinearGradient(0, 0, 0, h);
skyGrad.addColorStop(0, '#87CEEB');
skyGrad.addColorStop(0.4, '#B8E4F9');
skyGrad.addColorStop(0.7, '#E8F5E9');
skyGrad.addColorStop(1, '#C8E6C9');
CTX.fillStyle = skyGrad;
CTX.fillRect(0, 0, w, h);

CTX.fillStyle = '#FFF9C4';
CTX.beginPath();
CTX.arc(w * 0.85, h * 0.12, 28, 0, Math.PI * 2);
CTX.fill();
CTX.fillStyle = '#FFF176';
CTX.beginPath();
CTX.arc(w * 0.85, h * 0.12, 20, 0, Math.PI * 2);
CTX.fill();

for (const cloud of clouds) {
    cloud.x += cloud.speed;
    if (cloud.x > COLS + 5) cloud.x = -cloud.w - 2;
    drawCloud(cloud.x * CW, cloud.y * CH, cloud.w * CW);
}

CTX.fillStyle = 'rgba(76, 175, 80, 0.2)';
CTX.beginPath();
CTX.moveTo(0, SURFACE_ROW * CH);
for (let x = 0; x <= w; x += 40) {
    CTX.lineTo(x, SURFACE_ROW * CH - 30 - Math.sin(x * 0.01) * 25 - Math.sin(x * 0.025) * 15);
}
CTX.lineTo(w, SURFACE_ROW * CH);
CTX.fill();
}

function drawCloud(x, y, w) {
CTX.fillStyle = 'rgba(255,255,255,0.85)';
const h = w * 0.35;
CTX.beginPath();
CTX.arc(x, y, h * 0.7, 0, Math.PI * 2);
CTX.arc(x + w * 0.25, y - h * 0.3, h * 0.85, 0, Math.PI * 2);
CTX.arc(x + w * 0.55, y - h * 0.1, h * 0.7, 0, Math.PI * 2);
CTX.arc(x + w * 0.75, y + h * 0.1, h * 0.5, 0, Math.PI * 2);
CTX.fill();
}

function drawGround() {
const valleyGrad = CTX.createLinearGradient(0, SURFACE_ROW * CH, 0, ROWS * CH);
valleyGrad.addColorStop(0, '#1B5E20');
valleyGrad.addColorStop(0.5, '#0D3B12');
valleyGrad.addColorStop(1, '#071F09');
CTX.fillStyle = valleyGrad;
CTX.fillRect(VALLEY_LEFT * CW, SURFACE_ROW * CH, (VALLEY_RIGHT - VALLEY_LEFT) * CW, (ROWS - SURFACE_ROW) * CH);

// 沈むピットの“段差”演出（ロジックは canWalkerWalk が担当）
// Lv2: 中心は +1、端は +2 / Lv3+: 中心は +2、端は +3
let centerExtra = 0;
let edgeExtra = 0;
if (level === 2) {
    centerExtra = 1;
    edgeExtra = 2;
} else if (level >= 3) {
    centerExtra = 2;
    edgeExtra = 3;
}
if (centerExtra > 0) {
    const edgeMargin = 2;
    for (let c = VALLEY_LEFT; c < VALLEY_RIGHT; c++) {
        const isEdge = (c < VALLEY_LEFT + edgeMargin) || (c >= VALLEY_RIGHT - edgeMargin);
        const extra = isEdge ? edgeExtra : centerExtra;
        const bottomRow = Math.min(SURFACE_ROW + extra, ROWS - 1);
        CTX.fillStyle = isEdge ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.16)';
        CTX.fillRect(c * CW, bottomRow * CH, CW, CH);
    }
}

CTX.strokeStyle = 'rgba(0,0,0,0.15)';
CTX.lineWidth = 1;
for (let i = 0; i < 8; i++) {
    const lx = VALLEY_LEFT * CW + 2 + Math.random() * 2;
    CTX.beginPath();
    CTX.moveTo(lx, SURFACE_ROW * CH + i * CH);
    CTX.lineTo(lx + (Math.random()-0.5)*4, SURFACE_ROW * CH + (i+1) * CH);
    CTX.stroke();
    const rx = VALLEY_RIGHT * CW - 2 - Math.random() * 2;
    CTX.beginPath();
    CTX.moveTo(rx, SURFACE_ROW * CH + i * CH);
    CTX.lineTo(rx + (Math.random()-0.5)*4, SURFACE_ROW * CH + (i+1) * CH);
    CTX.stroke();
}

const cliffGrad = CTX.createLinearGradient(0, SURFACE_ROW * CH, 0, ROWS * CH);
cliffGrad.addColorStop(0, '#5D4037');
cliffGrad.addColorStop(1, '#3E2723');
CTX.fillStyle = cliffGrad;
CTX.fillRect((VALLEY_LEFT - 0.3) * CW, SURFACE_ROW * CH, CW * 0.3, (ROWS - SURFACE_ROW) * CH);
CTX.fillRect(VALLEY_RIGHT * CW, SURFACE_ROW * CH, CW * 0.3, (ROWS - SURFACE_ROW) * CH);

for (let r = SURFACE_ROW; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 1) {
            const x = c * CW;
            const y = r * CH;
            if (r === SURFACE_ROW) {
                const grassGrad = CTX.createLinearGradient(x, y, x, y + CH);
                grassGrad.addColorStop(0, '#66BB6A');
                grassGrad.addColorStop(0.4, '#4CAF50');
                grassGrad.addColorStop(1, '#388E3C');
                CTX.fillStyle = grassGrad;
                CTX.fillRect(x, y, CW + 0.5, CH + 0.5);
                CTX.strokeStyle = '#81C784';
                CTX.lineWidth = 1.5;
                for (let g = 0; g < 3; g++) {
                    const gx = x + (g + 0.5) * CW / 3;
                    CTX.beginPath();
                    CTX.moveTo(gx, y + 1);
                    CTX.lineTo(gx - 2, y - 3);
                    CTX.stroke();
                    CTX.beginPath();
                    CTX.moveTo(gx + 2, y + 1);
                    CTX.lineTo(gx + 4, y - 2);
                    CTX.stroke();
                }
            } else {
                const dirtGrad = CTX.createLinearGradient(x, y, x, y + CH);
                dirtGrad.addColorStop(0, '#6D4C41');
                dirtGrad.addColorStop(1, '#5D4037');
                CTX.fillStyle = dirtGrad;
                CTX.fillRect(x, y, CW + 0.5, CH + 0.5);
                CTX.fillStyle = 'rgba(0,0,0,0.08)';
                if ((r + c) % 3 === 0) CTX.fillRect(x + 3, y + 3, 3, 3);
                if ((r + c) % 4 === 1) CTX.fillRect(x + CW - 7, y + CH - 7, 2, 2);
            }
        } else if (grid[r][c] === 2) {
            drawTetrisBlock(c, r, gridColors[r][c]);
        }
    }
}

for (let r = 0; r < SURFACE_ROW; r++) {
    for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 2) {
            drawTetrisBlock(c, r, gridColors[r][c]);
        }
    }
}
}

function drawTetrisBlock(c, r, color) {
const x = c * CW;
const y = r * CH;
const pad = 1;

CTX.fillStyle = color || '#FFA500';
CTX.fillRect(x + pad, y + pad, CW - pad * 2, CH - pad * 2);

CTX.fillStyle = 'rgba(255,255,255,0.3)';
CTX.fillRect(x + pad, y + pad, CW - pad * 2, 3);
CTX.fillRect(x + pad, y + pad, 3, CH - pad * 2);

CTX.fillStyle = 'rgba(0,0,0,0.2)';
CTX.fillRect(x + CW - pad - 3, y + pad, 3, CH - pad * 2);
CTX.fillRect(x + pad, y + CH - pad - 3, CW - pad * 2, 3);

CTX.fillStyle = 'rgba(255,255,255,0.1)';
CTX.fillRect(x + 4, y + 4, CW - 8, CH - 8);
}

function drawCurrentPiece() {
if (!currentPiece) return;

const gy = computeGhost(currentPiece);
for (let r = 0; r < currentPiece.shape.length; r++) {
    for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
            const x = (currentPiece.x + c) * CW;
            const y = (gy + r) * CH;
            CTX.fillStyle = 'rgba(255,255,255,0.15)';
            CTX.fillRect(x + 1, y + 1, CW - 2, CH - 2);
            CTX.strokeStyle = 'rgba(255,255,255,0.3)';
            CTX.lineWidth = 1;
            CTX.strokeRect(x + 1, y + 1, CW - 2, CH - 2);
        }
    }
}

for (let r = 0; r < currentPiece.shape.length; r++) {
    for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
            drawTetrisBlock(currentPiece.x + c, currentPiece.y + r, currentPiece.color);
        }
    }
}
}

function drawWalker() {
if (!walker) return;

const charW = CW * 2.8;
const charH = CH * 3.8;
let px, py;

if (walkerFalling) {
    px = walkerX * CW + CW / 2 - charW / 2;
    py = walkerY * CH - charH + CH * 0.5 + walkerFallY;
    CTX.save();
    const centerX = px + charW / 2;
    const centerY = py + charH / 2;
    CTX.translate(centerX, centerY);
    CTX.rotate(walkerFallY * 0.03);
    fallingChar.draw(CTX, -charW/2, -charH/2, charW, charH);
    CTX.restore();
} else {
    px = walkerX * CW + CW / 2 - charW / 2;
    const groundRow = getGroundY(Math.floor(walkerX));
    py = groundRow * CH - charH + CH * 0.5;
    walker.draw(CTX, px, py, charW, charH, false);
}
}

function updateParticles() {
for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
}
}

function drawParticles() {
for (const p of particles) {
    CTX.globalAlpha = p.life / 40;
    CTX.fillStyle = p.color;
    CTX.fillRect(p.x - 2, p.y - 2, 4, 4);
}
CTX.globalAlpha = 1;
}

// ===========================================
//  UI
// ===========================================
function updateScoreDisplay() {
document.getElementById('scorePanel').textContent = 'スコア: ' + score;
document.getElementById('levelPanel').textContent = 'Lv.' + level;
}

function updateNextDisplay() {
if (!nextPiece) return;
NEXT_CTX.clearRect(0, 0, 80, 80);
const s = nextPiece.shape;
const bw = 16;
const ox = (80 - s[0].length * bw) / 2;
const oy = (80 - s.length * bw) / 2;
for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
        if (s[r][c]) {
            NEXT_CTX.fillStyle = nextPiece.color;
            NEXT_CTX.fillRect(ox + c * bw + 1, oy + r * bw + 1, bw - 2, bw - 2);
            NEXT_CTX.fillStyle = 'rgba(255,255,255,0.3)';
            NEXT_CTX.fillRect(ox + c * bw + 1, oy + r * bw + 1, bw - 2, 3);
        }
    }
}
}

function showMessage(title, sub) {
document.getElementById('msgText').textContent = title;
document.getElementById('msgSub').textContent = sub;
document.getElementById('messageOverlay').classList.add('show');
}

function hideMessage() {
document.getElementById('messageOverlay').classList.remove('show');
}

// ===========================================
//  Game Loop
// ===========================================
function gameLoop() {
if (gameState !== 'playing') {
    drawFrame();
    requestAnimationFrame(gameLoop);
    return;
}

// Drop piece
dropTimer++;
if (currentPiece) {
    if (dropTimer >= dropInterval) {
        if (!movePiece(0, 1)) {
            lockPiece(currentPiece);
            spawnNext();
        }
        dropTimer = 0;
    }
} else {
    spawnTimer++;
    if (spawnTimer > 15) {
        spawnNext();
        spawnTimer = 0;
    }
}

// Walker
if (!walkerFalling) {
    const nextX = walkerX + walkerSpeed;
    if (canWalkerWalk(nextX)) {
        walkerX = nextX;
        const frameChanged = walker.update();

        // 歩行音: フレーム切り替え時（足が接地するタイミング）
        if (frameChanged && (walker.currentFrame === 0 || walker.currentFrame === 2)) {
            sfx.playWalk();
        }

        // Success check
        if (walkerX >= VALLEY_RIGHT + 2) {
            score += 200 * level;
            const nextLevel = level + 1;
            level = nextLevel;
            walkerSpeed += 0.003;
            if (dropInterval > 20) dropInterval -= 5;
            updateScoreDisplay();
            sfx.playSuccess();

            // Lv2/Lv3 の差分を、理由つきで一言表示
            if (nextLevel === 2) {
                showMessage('谷が沈んだ', '薄い橋は足場にならない');
                setTimeout(hideMessage, 900);
            } else if (nextLevel === 3) {
                showMessage('さらに深い谷', '端は特に厚く必要');
                setTimeout(hideMessage, 900);
            }

            walkerX = 0;
            screamPlayed = false;
            for (let r = 0; r < ROWS; r++) {
                for (let c = VALLEY_LEFT; c < VALLEY_RIGHT; c++) {
                    if (grid[r][c] === 2) {
                        grid[r][c] = 0;
                        gridColors[r][c] = null;
                    }
                }
            }
            for (let i = 0; i < 50; i++) {
                particles.push({
                    x: VALLEY_RIGHT * CW,
                    y: SURFACE_ROW * CH,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 6 - 2,
                    life: 60,
                    color: ['#FFC107', '#FF5722', '#4CAF50', '#2196F3'][Math.floor(Math.random()*4)]
                });
            }
        }
    } else {
        // 落下開始
        walkerFalling = true;
        walkerFallVel = 0;
        walkerFallY = 0;

        // 悲鳴
        if (!screamPlayed) {
            sfx.playScream();
            screamPlayed = true;
        }

        setTimeout(() => {
            gameState = 'fail';
            sfx.stopBGM();
            sfx.playGameOver();
            showMessage('💀 ゲームオーバー', 'スコア: ' + score + ' ／ Lv.' + level);
        }, 1800);
    }
} else {
    walkerFallVel += 0.4;
    walkerFallY += walkerFallVel;
}

updateParticles();
drawFrame();
requestAnimationFrame(gameLoop);
}

function drawFrame() {
const w = CANVAS.width / devicePixelRatio;
const h = CANVAS.height / devicePixelRatio;
CTX.clearRect(0, 0, w, h);

drawBackground();
drawGround();
drawCurrentPiece();
drawWalker();
drawParticles();

CTX.strokeStyle = 'rgba(255,255,255,0.06)';
CTX.lineWidth = 1;
CTX.setLineDash([4, 4]);
CTX.beginPath();
CTX.moveTo(VALLEY_LEFT * CW, 0);
CTX.lineTo(VALLEY_LEFT * CW, SURFACE_ROW * CH);
CTX.moveTo(VALLEY_RIGHT * CW, 0);
CTX.lineTo(VALLEY_RIGHT * CW, SURFACE_ROW * CH);
CTX.stroke();
CTX.setLineDash([]);
}

// ===========================================
//  ② ActionButton（バネアニメーション付きボタン）
// ===========================================
class ActionButton {
    constructor(el, onPress, options = {}) {
        this.el         = el;
        this.onPress    = onPress;
        this.scaleDown  = options.scaleDown  ?? 0.82;
        this.springBack = options.springBack ?? 1.10;
        this.duration   = options.duration   ?? 70;
    }
    bind() {
        this.el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._animate();
            this.onPress(e);
        }, { passive: false });
        this.el.addEventListener('mousedown', (e) => {
            this._animate();
            this.onPress(e);
        });
    }
    _animate() {
        const el = this.el, d = this.duration;
        el.style.transition = `transform ${d}ms ease`;
        el.style.transform  = `scale(${this.scaleDown})`;
        setTimeout(() => {
            el.style.transform = `scale(${this.springBack})`;
            setTimeout(() => { el.style.transform = 'scale(1)'; }, d);
        }, d);
    }
}

// ===========================================
//  ③ Haptics（触覚フィードバック）
// ===========================================
const Haptics = {
    trigger(type) {
        if (!('vibrate' in navigator)) return;
        const p = { tap: [10], lock: [15, 8, 15], clear: [30, 15, 30], drop: [40, 20, 40] };
        navigator.vibrate(p[type] || [10]);
    }
};

// ===========================================
//  Input
// ===========================================
document.addEventListener('keydown', e => {
if (gameState !== 'playing') return;
switch (e.key) {
    case 'ArrowLeft': movePiece(-1, 0); e.preventDefault(); break;
    case 'ArrowRight': movePiece(1, 0); e.preventDefault(); break;
    case 'ArrowDown': movePiece(0, 1); dropTimer = 0; e.preventDefault(); break;
    case 'ArrowUp':
    case ' ':
        if (currentPiece) rotate(currentPiece);
        e.preventDefault();
        break;
    case 'Shift':
        if (currentPiece) hardDrop(currentPiece);
        e.preventDefault();
        break;
}
});

// iOS Safari のダブルタップズーム / 二重イベントの揺れを抑制
let lastDocTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastDocTouchEnd <= 300) {
        if (e.cancelable) e.preventDefault();
    }
    lastDocTouchEnd = now;
}, { passive: false });

// ④ iOS Safari ピンチズーム・回転ジェスチャーを完全封鎖
['gesturestart', 'gesturechange', 'gestureend'].forEach(evt => {
    document.addEventListener(evt, e => e.preventDefault());
});

let dasTimer = null;
let dasAction = null;
let dasDelay = 170;
let dasRepeat = 50;
const CLICK_GUARD_MS = 350; // touchstart直後のclick二重発火対策

function startDAS(action) {
stopDAS();
action();
dasAction = action;
dasTimer = setTimeout(() => {
    dasTimer = setInterval(action, dasRepeat);
}, dasDelay);
}

function stopDAS() {
if (dasTimer) {
    clearTimeout(dasTimer);
    clearInterval(dasTimer);
    dasTimer = null;
}
dasAction = null;
}

function setupBtn(id, action, isRepeat) {
const btn = document.getElementById(id);
if (!btn) return;
let ignoreClickUntil = 0;

if (isRepeat) {
    btn.addEventListener('mousedown', e => { e.preventDefault(); startDAS(action); });
    btn.addEventListener('mouseup', stopDAS);
    btn.addEventListener('mouseleave', stopDAS);
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        ignoreClickUntil = Date.now() + CLICK_GUARD_MS;
        startDAS(action);
    }, { passive: false });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        e.stopPropagation();
        stopDAS();
    }, { passive: false });
    btn.addEventListener('touchcancel', e => { e.stopPropagation(); stopDAS(); }, { passive: false });
} else {
    // touchstart → click の二重発火（誤操作）を必ず抑止
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        ignoreClickUntil = Date.now() + CLICK_GUARD_MS;
        action();
    }, { passive: false });
    btn.addEventListener('click', e => {
        if (Date.now() < ignoreClickUntil) return;
        e.preventDefault();
        e.stopPropagation();
        action();
    });
}
}

setupBtn('btnLeft', () => movePiece(-1, 0), true);
setupBtn('btnRight', () => movePiece(1, 0), true);
setupBtn('btnDown', () => { movePiece(0, 1); dropTimer = 0; }, true);
// ② btnRotate / btnDrop はバネアニメーション付き ActionButton
new ActionButton(document.getElementById('btnRotate'), () => {
    if (currentPiece && gameState === 'playing') { rotate(currentPiece); Haptics.trigger('tap'); }
}, { scaleDown: 0.82, springBack: 1.10, duration: 70 }).bind();

new ActionButton(document.getElementById('btnDrop'), () => {
    if (currentPiece && gameState === 'playing') { hardDrop(currentPiece); Haptics.trigger('drop'); }
}, { scaleDown: 0.80, springBack: 1.12, duration: 70 }).bind();

// Sound toggle
document.getElementById('soundToggle').addEventListener('click', () => {
sfx.init();
sfx.resume();
const on = sfx.toggle();
document.getElementById('soundToggle').textContent = on ? '🔊' : '🔇';
if (on && gameState === 'playing') sfx.startBGM();
});

// Touch swipe on canvas
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let lastQuickTapTime = 0;
let lastQuickTapX = 0;
let lastQuickTapY = 0;
const DOUBLE_TAP_CANVAS_MS = 320;
const DOUBLE_TAP_CANVAS_DIST = 18; // px

CANVAS.addEventListener('touchstart', e => {
if (gameState !== 'playing') return;
const t = e.touches[0];
touchStartX = t.clientX;
touchStartY = t.clientY;
touchStartTime = Date.now();
e.preventDefault();
}, { passive: false });
CANVAS.addEventListener('touchmove', e => {
if (gameState !== 'playing') return;
e.preventDefault();
const t = e.touches[0];
const dx = t.clientX - touchStartX;
const dy = t.clientY - touchStartY;
if (Math.abs(dx) > 25) {
    movePiece(dx > 0 ? 1 : -1, 0);
    touchStartX = t.clientX;
}
if (dy > 25) {
    movePiece(0, 1);
    dropTimer = 0;
    touchStartY = t.clientY;
}
}, { passive: false });
CANVAS.addEventListener('touchend', e => {
if (gameState !== 'playing') return;
e.preventDefault();
e.stopPropagation();

const elapsed = Date.now() - touchStartTime;
if (elapsed < 200) {
    if (currentPiece) {
        // クイックタップ回転はダブルタップを“無視”して誤操作を防ぐ
        const now = Date.now();
        const dx = touchStartX - lastQuickTapX;
        const dy = touchStartY - lastQuickTapY;
        const isDoubleTap = (now - lastQuickTapTime <= DOUBLE_TAP_CANVAS_MS) &&
            (dx * dx + dy * dy <= DOUBLE_TAP_CANVAS_DIST * DOUBLE_TAP_CANVAS_DIST);

        if (!isDoubleTap) {
            rotate(currentPiece);
            lastQuickTapTime = now;
            lastQuickTapX = touchStartX;
            lastQuickTapY = touchStartY;
        }
    }
}
}, { passive: false });

// ===========================================
//  Start / Retry
// ===========================================
document.getElementById('startBtn').addEventListener('click', () => {
document.getElementById('startOverlay').style.display = 'none';
hideMessage();

// AudioContextは必ずユーザー操作内で初期化
sfx.init();
sfx.resume();

walker = new WalkingCharacter();
fallingChar = new FallingCharacter();
initGame();
gameState = 'playing';
sfx.startBGM();
requestAnimationFrame(gameLoop);
});

document.getElementById('retryBtn').addEventListener('click', () => {
hideMessage();
sfx.init();
sfx.resume();
walker = new WalkingCharacter();
fallingChar = new FallingCharacter();
initGame();
gameState = 'playing';
sfx.startBGM();
});

// Initial draw
initGrid();
walker = new WalkingCharacter();
fallingChar = new FallingCharacter();
walkerX = 3;
walkerY = SURFACE_ROW;

function titleLoop() {
if (gameState !== 'title') return;
walker.update();
drawFrame();
walkerX += 0.01;
if (walkerX > VALLEY_LEFT - 1) walkerX = 0;
requestAnimationFrame(titleLoop);
}
requestAnimationFrame(titleLoop);
