import { SoundFX } from '../utils/SoundFX.js';

// 3 Niveles con estructura, colores, enemigos y diálogos propios
const LEVELS = {
  1: {
    name: 'MURAL 01: EL PASAJE',
    floorA: 0x161925,
    floorB: 0x1c2030,
    wallTop: 0x3a405a,
    wallSide: 0x1e2233,
    inkTop: 0x5a189a,
    inkSide: 0x240046,
    inkBorder: 0xf72585,
    enemyType: 'gota',
    dialog: [
      'KAIRO: ¡Maldición! La tinta negra cubrió todo el Pasaje del Tag.',
      'KAIRO: Si recupero los 3 White Shards devolveré el color a este mural.',
      'TIP RPG: Usa ESPACIO para soltar pulsos y Q para activar tu Escudo Sónico (40 EP).'
    ],
    map: [
      '#############',
      '#..I..I..I.S#',
      '#.#I#.#I#.#.#',
      '#I..E...I..I#',
      '#.#.#I#.#.#.#',
      '#..I..I..E..#',
      '#.#I#.#.#I#.#',
      '#I..E..I...I#',
      '#.#.#I#.#.#.#',
      '#S.I..I..I.S#',
      '#############'
    ]
  },
  2: {
    name: 'MURAL 02: PLAZA CARTELES',
    floorA: 0x22182b,
    floorB: 0x2a1f36,
    wallTop: 0x6c4675,
    wallSide: 0x3b2242,
    inkTop: 0xe85d04,
    inkSide: 0x9d0208,
    inkBorder: 0xffbe0b,
    enemyType: 'fast',
    dialog: [
      'KAIRO: La Plaza de Carteles está repleta de Salpicaduras Rápidas.',
      'KAIRO: Son mucho más veloces... mejor usar el Dash (SHIFT) y mi Escudo (Q).'
    ],
    map: [
      '#############',
      '#..I.....I.S#',
      '#.#.#I#I#.#.#',
      '#..E..I..E..#',
      '#I#.#...#.#I#',
      '#..I..E..I..#',
      '#I#.#...#.#I#',
      '#..E..I..E..#',
      '#.#.#I#I#.#.#',
      '#S.I.....I.S#',
      '#############'
    ]
  },
  3: {
    name: 'MURAL 03: GALERÍA FINAL',
    floorA: 0x1a1216,
    floorB: 0x24171d,
    wallTop: 0x590d22,
    wallSide: 0x2b0510,
    inkTop: 0x2b2d42,
    inkSide: 0x141521,
    inkBorder: 0x00f5d4,
    enemyType: 'shadow',
    dialog: [
      'EL BORRÓN: ¡Nunca llegarás al Último Trazo, pequeño grafitero!',
      'KAIRO: Esas Sombras de Tinta me persiguen... ¡A limpiar la galería!'
    ],
    map: [
      '#############',
      '#..I..E..I.S#',
      '#.#I#.#.#I#.#',
      '#I....I....I#',
      '#.#.#I#I#.#.#',
      '#E.I..S..I.E#',
      '#.#.#I#I#.#.#',
      '#I....I....I#',
      '#.#I#.#.#I#.#',
      '#S.I..E..I..#',
      '#############'
    ]
  }
};

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.TILE = 48;
    this.HUD_HEIGHT = 52;
    this.COLS = 13;
    this.ROWS = 11;
  }

  init(data) {
    this.level = data.level || 1;
    this.lives = data.lives !== undefined ? data.lives : 3;
    this.maxPulses = data.maxPulses || 2;
    this.pulseRange = data.pulseRange || 2;
    this.xp = data.xp || 0;
    this.rpgLevel = data.rpgLevel || 1;
    this.ep = 60; // Energía de Pintura inicial (máx 100)
  }

  create() {
    this.cfg = LEVELS[this.level] || LEVELS[1];
    this.activePulses = 0;
    this.shardsCollected = 0;
    this.totalShards = 3;
    this.isInvulnerable = false;
    this.hasShield = false;
    this.isDashing = false;
    this.dashCooldown = false;
    this.inDialogue = false;

    SoundFX.playBGM('game');

    this.createTextures();
    this.createHUD();
    this.buildLevelFromMap();
    this.createPlayer();
    this.setupControls();

    // Regeneración pasiva de Energía RPG (EP)
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.inDialogue && this.ep < 100) {
          this.ep = Math.min(100, this.ep + 4);
          this.updateHUD();
        }
      }
    });

    // Inicia la escena con el diálogo de historia del nivel
    this.startDialogue(this.cfg.dialog);
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Texturas 2.5D específicas de cada nivel (cara superior + cara frontal 3D)
    const solidKey = `wall_solid_${this.level}`;
    if (!this.textures.exists(solidKey)) {
      g.fillStyle(this.cfg.wallSide, 1);
      g.fillRect(0, 0, 48, 48);
      g.fillStyle(this.cfg.wallTop, 1);
      g.fillRect(0, 0, 48, 34);
      g.lineStyle(2, 0xffffff, 0.12);
      g.strokeRect(1, 1, 46, 32);
      g.generateTexture(solidKey, 48, 48);
      g.clear();
    }

    const inkKey = `wall_ink_${this.level}`;
    if (!this.textures.exists(inkKey)) {
      g.fillStyle(this.cfg.inkSide, 1);
      g.fillRoundedRect(2, 6, 44, 40, 6);
      g.fillStyle(this.cfg.inkTop, 1);
      g.fillRoundedRect(2, 2, 44, 32, 6);
      g.lineStyle(2, this.cfg.inkBorder, 1);
      g.strokeRoundedRect(3, 3, 42, 30, 5);
      g.generateTexture(inkKey, 48, 48);
      g.clear();
    }

    if (this.textures.exists('kairo')) {
      g.destroy();
      return;
    }

    // Kairo con sombra 2.5D
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(20, 36, 26, 10);
    g.fillStyle(0x00f5d4, 1);
    g.fillRoundedRect(5, 3, 30, 30, 8);
    g.fillStyle(0x0b0c10, 1);
    g.fillRect(10, 11, 20, 8);
    g.fillStyle(0xffbe0b, 1);
    g.fillRect(14, 13, 4, 4);
    g.fillRect(22, 13, 4, 4);
    g.generateTexture('kairo', 40, 42);
    g.clear();

    // Pulso de Aerosol
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(20, 35, 24, 8);
    g.fillStyle(0xff006e, 1);
    g.fillCircle(20, 18, 15);
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(20, 18, 11);
    g.generateTexture('aerosol_pulse', 40, 40);
    g.clear();

    // Onda
    g.fillStyle(0x00f5d4, 0.9);
    g.fillRoundedRect(4, 4, 40, 40, 8);
    g.fillStyle(0xffffff, 0.8);
    g.fillRoundedRect(12, 12, 24, 24, 4);
    g.generateTexture('wave', 48, 48);
    g.clear();

    // White Shard (cristal con brillo)
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(18, 33, 20, 7);
    g.fillStyle(0xffffff, 1);
    g.fillPoints([{ x: 18, y: 2 }, { x: 32, y: 16 }, { x: 18, y: 30 }, { x: 4, y: 16 }], true);
    g.lineStyle(2, 0x00f5d4, 1);
    g.strokePoints([{ x: 18, y: 2 }, { x: 32, y: 16 }, { x: 18, y: 30 }, { x: 4, y: 16 }], true);
    g.generateTexture('white_shard', 36, 38);
    g.clear();

    // Enemigo 1: Gota Callejera
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(18, 33, 22, 8);
    g.fillStyle(0xff006e, 1);
    g.fillCircle(18, 18, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(13, 15, 3);
    g.fillCircle(23, 15, 3);
    g.generateTexture('enemy_gota', 36, 38);
    g.clear();

    // Enemigo 2: Salpicadura Rápida
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(18, 33, 22, 8);
    g.fillStyle(0xffbe0b, 1);
    g.fillRoundedRect(4, 4, 28, 26, 10);
    g.fillStyle(0x0b0c10, 1);
    g.fillRect(9, 12, 6, 6);
    g.fillRect(21, 12, 6, 6);
    g.generateTexture('enemy_fast', 36, 38);
    g.clear();

    // Enemigo 3: Sombra de Tinta (persigue)
    g.fillStyle(0x000000, 0.45);
    g.fillEllipse(18, 33, 24, 8);
    g.fillStyle(0x111111, 1);
    g.fillCircle(18, 18, 15);
    g.lineStyle(2, 0x00f5d4, 1);
    g.strokeCircle(18, 18, 15);
    g.fillStyle(0xff006e, 1);
    g.fillRect(11, 14, 5, 4);
    g.fillRect(20, 14, 5, 4);
    g.generateTexture('enemy_shadow', 36, 38);
    g.clear();

    // Power-ups diferenciados
    g.fillStyle(0x00f5d4, 1);
    g.fillRoundedRect(2, 2, 28, 28, 8);
    g.fillStyle(0xff006e, 1);
    g.fillCircle(16, 16, 8);
    g.generateTexture('pu_pulse', 32, 32);
    g.clear();

    g.fillStyle(0xffbe0b, 1);
    g.fillRoundedRect(2, 2, 28, 28, 8);
    g.fillStyle(0xffffff, 1);
    g.fillRect(14, 6, 4, 20);
    g.fillRect(6, 14, 20, 4);
    g.generateTexture('pu_range', 32, 32);
    g.clear();

    g.fillStyle(0xff006e, 1);
    g.fillRoundedRect(2, 2, 28, 28, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 16, 6);
    g.generateTexture('pu_life', 32, 32);
    g.destroy();
  }

  createHUD() {
    this.add.rectangle(this.scale.width / 2, this.HUD_HEIGHT / 2, this.scale.width, this.HUD_HEIGHT, 0x0b0c10).setDepth(20);

    this.livesText = this.add.text(10, 8, '', { fontSize: '15px', fontStyle: 'bold', color: '#ff006e' }).setDepth(21);
    this.rpgText = this.add.text(10, 28, '', { fontSize: '13px', fontStyle: 'bold', color: '#00f5d4' }).setDepth(21);
    this.statsText = this.add.text(220, 16, '', { fontSize: '13px', fontStyle: 'bold', color: '#ffbe0b' }).setDepth(21);
    this.shardsText = this.add.text(395, 16, '', { fontSize: '15px', fontStyle: 'bold', color: '#ffffff' }).setDepth(21);

    this.muteBtn = this.add.text(this.scale.width - 12, 14, SoundFX.muted ? '🔇' : '🔊', {
      fontSize: '18px'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(21);

    this.muteBtn.on('pointerdown', () => {
      const muted = SoundFX.toggleMute();
      this.muteBtn.setText(muted ? '🔇' : '🔊');
    });

    this.updateHUD();
  }

  updateHUD() {
    const hearts = '♥'.repeat(Math.max(0, this.lives));
    this.livesText.setText(`VIDAS: ${hearts || '0'}  |  NV.${this.rpgLevel}`);
    this.rpgText.setText(`EP(Q): ${this.ep}/100  XP: ${this.xp}`);
    this.statsText.setText(`PULSOS:${this.maxPulses} RANGO:${this.pulseRange}`);
    this.shardsText.setText(`SHARDS: ${this.shardsCollected}/${this.totalShards}`);
  }

  // --- SISTEMA DE DIÁLOGOS RPG ---
  startDialogue(lines) {
    this.inDialogue = true;
    this.dialogLines = lines;
    this.dialogIndex = 0;

    const w = this.scale.width;
    const h = this.scale.height;

    this.dialogBox = this.add.rectangle(w / 2, h - 62, w - 32, 92, 0x0b0c10, 0.94)
      .setStrokeStyle(3, 0x00f5d4)
      .setDepth(50);

    this.dialogText = this.add.text(32, h - 94, this.dialogLines[0], {
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: w - 64 },
      lineSpacing: 6
    }).setDepth(51);

    this.dialogHint = this.add.text(w - 28, h - 28, '[ESPACIO / ENTER ▶]', {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffbe0b'
    }).setOrigin(1, 1).setDepth(51);

    SoundFX.play('dialog');
  }

  advanceDialogue() {
    this.dialogIndex++;
    SoundFX.play('dialog');

    if (this.dialogIndex >= this.dialogLines.length) {
      this.dialogBox.destroy();
      this.dialogText.destroy();
      this.dialogHint.destroy();
      this.inDialogue = false;
    } else {
      this.dialogText.setText(this.dialogLines[this.dialogIndex]);
    }
  }

  gainXP(amount, x, y) {
    this.xp += amount;
    if (this.xp >= this.rpgLevel * 100) {
      this.rpgLevel++;
      this.ep = 100;
      SoundFX.play('powerup');
      this.showFloatingText(x, y - 16, `¡SUBISTE A NV.${this.rpgLevel}!`, '#00f5d4');
    }
    this.updateHUD();
  }

  // Habilidad RPG: Escudo Sónico (Tecla Q, cuesta 40 EP)
  activateShieldSkill() {
    if (this.inDialogue || this.hasShield || this.ep < 40) return;

    this.ep -= 40;
    this.hasShield = true;
    SoundFX.play('skill');
    this.updateHUD();
    this.showFloatingText(this.player.x, this.player.y, '¡ESCUDO SÓNICO!', '#00f5d4');

    this.shieldAura = this.add.circle(this.player.x, this.player.y, 28, 0x00f5d4, 0.28)
      .setStrokeStyle(3, 0x00f5d4)
      .setDepth(9);

    this.time.delayedCall(3500, () => {
      this.hasShield = false;
      if (this.shieldAura) this.shieldAura.destroy();
    });
  }

  showFloatingText(x, y, message, color = '#ffffff') {
    const txt = this.add.text(x, y - 10, message, {
      fontSize: '14px',
      fontStyle: 'bold',
      color,
      stroke: '#0b0c10',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 44,
      alpha: 0,
      duration: 950,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy()
    });
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const p = this.add.rectangle(x, y, 6, 6, color).setDepth(15);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(18, 42);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 320,
        onComplete: () => p.destroy()
      });
    }
  }

  gridToPixel(col, row) {
    return {
      x: col * this.TILE + this.TILE / 2,
      y: this.HUD_HEIGHT + row * this.TILE + this.TILE / 2
    };
  }

  pixelToGrid(x, y) {
    return {
      col: Math.floor(x / this.TILE),
      row: Math.floor((y - this.HUD_HEIGHT) / this.TILE)
    };
  }

  buildLevelFromMap() {
    this.solidWalls = this.physics.add.staticGroup();
    this.inkWalls = this.physics.add.staticGroup();
    this.powerups = this.physics.add.group();
    this.shards = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.gridMap = [];

    const solidKey = `wall_solid_${this.level}`;
    const inkKey = `wall_ink_${this.level}`;

    for (let r = 0; r < this.ROWS; r++) {
      this.gridMap[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        const pos = this.gridToPixel(c, r);
        const floorColor = (r + c) % 2 === 0 ? this.cfg.floorA : this.cfg.floorB;
        this.add.rectangle(pos.x, pos.y, this.TILE, this.TILE, floorColor);

        const ch = this.cfg.map[r][c];
        if (ch === '#') {
          this.solidWalls.create(pos.x, pos.y, solidKey);
          this.gridMap[r][c] = 1;
        } else if (ch === 'I') {
          const wall = this.inkWalls.create(pos.x, pos.y, inkKey);
          wall.setData('gridPos', { col: c, row: r });
          this.gridMap[r][c] = 2;
        } else {
          this.gridMap[r][c] = 0;
          if (ch === 'S') {
            const shard = this.shards.create(pos.x, pos.y, 'white_shard');
            this.tweens.add({
              targets: shard,
              y: pos.y - 6,
              scaleX: 0.75,
              duration: 650,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          } else if (ch === 'E') {
            this.createEnemyAt(pos.x, pos.y);
          }
        }
      }
    }
  }

  createEnemyAt(x, y) {
    const type = this.cfg.enemyType;
    const tex = `enemy_${type}`;
    const enemy = this.enemies.create(x, y, tex);
    enemy.body.setSize(28, 28);
    enemy.setData('type', type);
    enemy.setData('speed', type === 'fast' ? 135 : type === 'shadow' ? 105 : 85);
    this.pickRandomDirection(enemy);
  }

  createPlayer() {
    const start = this.gridToPixel(1, 1);
    this.player = this.physics.add.sprite(start.x, start.y, 'kairo').setDepth(10);
    this.player.body.setSize(28, 28);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.solidWalls);
    this.physics.add.collider(this.player, this.inkWalls);
    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
    this.physics.add.overlap(this.player, this.shards, this.collectShard, null, this);

    this.physics.add.collider(this.enemies, this.solidWalls, (e) => this.pickRandomDirection(e));
    this.physics.add.collider(this.enemies, this.inkWalls, (e) => this.pickRandomDirection(e));
    this.physics.add.overlap(this.player, this.enemies, (p, enemy) => {
      if (this.hasShield) {
        this.spawnParticles(enemy.x, enemy.y, 0x00f5d4, 12);
        this.gainXP(35, enemy.x, enemy.y);
        SoundFX.play('explode');
        enemy.destroy();
      } else {
        this.damagePlayer();
      }
    });
  }

  pickRandomDirection(enemy) {
    const speed = enemy.getData('speed') || 85;
    const dirs = [
      { vx: speed, vy: 0 }, { vx: -speed, vy: 0 },
      { vx: 0, vy: speed }, { vx: 0, vy: -speed }
    ];
    const choice = Phaser.Utils.Array.GetRandom(dirs);
    enemy.setVelocity(choice.vx, choice.vy);
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.inDialogue) this.advanceDialogue();
      else this.placePulse();
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.inDialogue) this.advanceDialogue();
    });
    this.input.keyboard.on('keydown-J', () => this.placePulse());
    this.input.keyboard.on('keydown-SHIFT', () => this.triggerDash());
    this.input.keyboard.on('keydown-K', () => this.triggerDash());
    this.input.keyboard.on('keydown-Q', () => this.activateShieldSkill());
    this.input.keyboard.on('keydown-M', () => {
      const muted = SoundFX.toggleMute();
      this.muteBtn.setText(muted ? '🔇' : '🔊');
    });
  }

  triggerDash() {
    if (this.inDialogue || this.dashCooldown || this.isDashing) return;
    SoundFX.play('dash');
    this.isDashing = true;
    this.dashCooldown = true;
    this.player.setTint(0xffbe0b);

    this.time.delayedCall(160, () => {
      this.isDashing = false;
      this.player.clearTint();
    });
    this.time.delayedCall(900, () => {
      this.dashCooldown = false;
    });
  }

  placePulse() {
    if (this.inDialogue || this.activePulses >= this.maxPulses) return;

    SoundFX.play('place');
    const { col, row } = this.pixelToGrid(this.player.x, this.player.y);
    const pos = this.gridToPixel(col, row);

    this.activePulses++;
    const pulse = this.add.sprite(pos.x, pos.y, 'aerosol_pulse');

    this.tweens.add({
      targets: pulse,
      scale: 1.2,
      duration: 220,
      yoyo: true,
      repeat: 3
    });

    this.time.delayedCall(1650, () => {
      pulse.destroy();
      this.activePulses--;
      this.detonatePulse(col, row);
    });
  }

  detonatePulse(col, row) {
    SoundFX.play('explode');
    const affectedCells = [{ col, row }];
    const dirs = [
      { dc: 1, dr: 0 }, { dc: -1, dr: 0 },
      { dc: 0, dr: 1 }, { dc: 0, dr: -1 }
    ];

    for (const dir of dirs) {
      for (let step = 1; step <= this.pulseRange; step++) {
        const nc = col + dir.dc * step;
        const nr = row + dir.dr * step;

        if (nr < 0 || nr >= this.ROWS || nc < 0 || nc >= this.COLS) break;
        if (this.gridMap[nr][nc] === 1) break;

        affectedCells.push({ col: nc, row: nr });

        if (this.gridMap[nr][nc] === 2) {
          this.destroyInkWall(nc, nr, true);
          break;
        }
      }
    }

    const playerCell = this.pixelToGrid(this.player.x, this.player.y);
    let hitPlayer = false;

    for (const cell of affectedCells) {
      const pos = this.gridToPixel(cell.col, cell.row);
      const wave = this.add.sprite(pos.x, pos.y, 'wave');

      this.tweens.add({
        targets: wave,
        alpha: 0,
        scale: 0.7,
        duration: 320,
        onComplete: () => wave.destroy()
      });

      if (cell.col === playerCell.col && cell.row === playerCell.row) {
        hitPlayer = true;
      }

      this.enemies.getChildren().forEach((enemy) => {
        const eCell = this.pixelToGrid(enemy.x, enemy.y);
        if (eCell.col === cell.col && eCell.row === cell.row) {
          this.spawnParticles(enemy.x, enemy.y, 0xff006e, 10);
          this.gainXP(35, enemy.x, enemy.y);
          enemy.destroy();
        }
      });
    }

    if (hitPlayer && !this.hasShield) this.damagePlayer();
  }

  destroyInkWall(col, row, allowDrop) {
    this.gridMap[row][col] = 0;
    this.inkWalls.getChildren().forEach((wall) => {
      const gPos = wall.getData('gridPos');
      if (gPos && gPos.col === col && gPos.row === row) {
        const { x, y } = wall;
        wall.destroy();
        this.spawnParticles(x, y, this.cfg.inkBorder, 6);
        this.ep = Math.min(100, this.ep + 5);
        this.updateHUD();

        if (allowDrop && Math.random() < 0.28) {
          const types = [
            { type: 'pulse', tex: 'pu_pulse' },
            { type: 'range', tex: 'pu_range' },
            { type: 'life', tex: 'pu_life' }
          ];
          const chosen = Phaser.Utils.Array.GetRandom(types);
          const item = this.powerups.create(x, y, chosen.tex);
          item.setData('type', chosen.type);

          this.tweens.add({
            targets: item,
            scale: 1.15,
            duration: 500,
            yoyo: true,
            repeat: -1
          });
        }
      }
    });
  }

  collectPowerup(player, item) {
    const type = item.getData('type');
    const { x, y } = item;
    item.destroy();
    SoundFX.play('powerup');

    if (type === 'pulse') {
      this.maxPulses++;
      this.showFloatingText(x, y, '+1 AEROSOL', '#00f5d4');
    } else if (type === 'range') {
      this.pulseRange++;
      this.showFloatingText(x, y, '+1 RANGO', '#ffbe0b');
    } else if (type === 'life') {
      if (this.lives < 3) {
        this.lives++;
        this.showFloatingText(x, y, '+1 VIDA ♥', '#ff006e');
      } else {
        this.ep = 100;
        this.showFloatingText(x, y, 'EP AL MÁXIMO', '#00f5d4');
      }
    }
    this.updateHUD();
  }

  collectShard(player, shard) {
    const { x, y } = shard;
    shard.destroy();
    SoundFX.play('shard');
    this.spawnParticles(x, y, 0x00f5d4, 12);
    this.showFloatingText(x, y, 'WHITE SHARD! +50 XP', '#00f5d4');
    this.gainXP(50, x, y);

    this.shardsCollected++;
    this.updateHUD();

    if (this.shardsCollected >= this.totalShards) {
      this.time.delayedCall(450, () => {
        if (this.level < 3) {
          this.scene.start('PlayScene', {
            level: this.level + 1,
            lives: this.lives,
            maxPulses: this.maxPulses,
            pulseRange: this.pulseRange,
            xp: this.xp,
            rpgLevel: this.rpgLevel
          });
        } else {
          this.scene.start('BossScene', { lives: this.lives });
        }
      });
    }
  }

  damagePlayer() {
    if (this.isInvulnerable || this.hasShield) return;

    SoundFX.play('hit');
    this.lives--;
    this.updateHUD();
    this.cameras.main.shake(150, 0.01);

    if (this.lives <= 0) {
      SoundFX.stopBGM();
      this.scene.start('ResultScene', { won: false });
      return;
    }

    this.isInvulnerable = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 120,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvulnerable = false;
      }
    });
  }

  update() {
    if (this.inDialogue) {
      this.player.setVelocity(0, 0);
      this.enemies.getChildren().forEach((e) => e.setVelocity(0, 0));
      return;
    }

    // Reanuda enemigos si estaban frenados por diálogo
    this.enemies.getChildren().forEach((e) => {
      if (e.body.velocity.x === 0 && e.body.velocity.y === 0) {
        this.pickRandomDirection(e);
      }
      // Enemigos Sombra (Mural 03) persiguen a Kairo si están cerca
      if (e.getData('type') === 'shadow') {
        const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
        if (dist < 180) {
          this.physics.moveToObject(e, this.player, e.getData('speed'));
        }
      }
    });

    const speed = this.isDashing ? 340 : 185;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.keys.D.isDown) vx = speed;

    if (this.cursors.up.isDown || this.keys.W.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.keys.S.isDown) vy = speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    if (this.hasShield && this.shieldAura) {
      this.shieldAura.setPosition(this.player.x, this.player.y);
    }
  }
}