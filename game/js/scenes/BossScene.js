import { SoundFX } from '../utils/SoundFX.js';

export class BossScene extends Phaser.Scene {
  constructor() {
    super('BossScene');
  }

  init(data) {
    this.playerLives = data.lives || 3;
  }

  create() {
    SoundFX.playBGM('boss');
    const { width, height } = this.scale;
    this.bossHP = 5;
    this.isActing = false;

    // Fondo del callejón final
    this.add.rectangle(width / 2, height / 2, width, height, 0x10121a);

    this.add.text(width / 2, 36, 'DUELO FINAL: EL BORRÓN', {
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ff006e'
    }).setOrigin(0.5);

    this.add.text(width / 2, 68, 'Presiona ESPACIO o ENTER justo en la zona brillante', {
      fontSize: '14px',
      color: '#c7ccd8'
    }).setOrigin(0.5);

    // Kairo (izquierda) y El Borrón (derecha)
    this.kairo = this.add.rectangle(150, 230, 56, 56, 0x00f5d4).setStrokeStyle(3, 0xffffff);
    this.add.text(150, 275, 'KAIRO', { fontSize: '14px', fontStyle: 'bold', color: '#00f5d4' }).setOrigin(0.5);

    this.boss = this.add.circle(470, 220, 52, 0x3a0ca3).setStrokeStyle(5, 0xff006e);
    this.add.text(470, 290, 'EL BORRÓN', { fontSize: '14px', fontStyle: 'bold', color: '#ff006e' }).setOrigin(0.5);

    // Latido del jefe
    this.tweens.add({
      targets: this.boss,
      scale: 1.08,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // HUD de vidas
    this.playerHPText = this.add.text(150, 140, '', { fontSize: '18px', fontStyle: 'bold', color: '#00f5d4' }).setOrigin(0.5);
    this.bossHPText = this.add.text(470, 140, '', { fontSize: '18px', fontStyle: 'bold', color: '#ff006e' }).setOrigin(0.5);
    this.updateHUD();

    // Mensaje de feedback
    this.feedbackText = this.add.text(width / 2, 345, '¡Prepárate para el trazo!', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffbe0b'
    }).setOrigin(0.5);

    // Barra de timing estilo Paper Mario
    this.barX = width / 2;
    this.barY = 420;
    this.barWidth = 380;

    this.add.rectangle(this.barX, this.barY, this.barWidth, 28, 0x2a2d3d).setStrokeStyle(2, 0xffffff);
    // Zona perfecta (centro)
    this.add.rectangle(this.barX, this.barY, 70, 28, 0x00f5d4, 0.85);

    // Cursor móvil
    this.cursor = this.add.rectangle(this.barX - this.barWidth / 2, this.barY, 12, 42, 0xffbe0b);
    this.cursorTween = this.tweens.add({
      targets: this.cursor,
      x: this.barX + this.barWidth / 2,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Controles de golpe
    this.input.keyboard.on('keydown-SPACE', () => this.attemptHit());
    this.input.keyboard.on('keydown-ENTER', () => this.attemptHit());
    this.input.keyboard.on('keydown-E', () => this.attemptHit());
  }

  updateHUD() {
    this.playerHPText.setText(`VIDAS: ${'♥ '.repeat(Math.max(0, this.playerLives)).trim()}`);
    this.bossHPText.setText(`TINTA: ${'■ '.repeat(Math.max(0, this.bossHP)).trim()}`);
  }

  attemptHit() {
    if (this.isActing) return;
    this.isActing = true;
    this.cursorTween.pause();

    const distance = Math.abs(this.cursor.x - this.barX);

    if (distance <= 38) {
      // Golpe perfecto
      SoundFX.play('shard');
      this.bossHP--;
      this.feedbackText.setText('¡TRAZO PERFECTO! -1 a El Borrón').setColor('#00f5d4');
      this.cameras.main.shake(120, 0.01);

      this.tweens.add({
        targets: this.boss,
        x: 490,
        duration: 80,
        yoyo: true,
        repeat: 2
      });
    } else {
      // Falló el timing -> contraataque del jefe
      SoundFX.play('hit');
      this.playerLives--;
      this.feedbackText.setText('¡FALLASTE! El Borrón contraataca').setColor('#ff006e');
      this.cameras.main.shake(180, 0.015);

      this.tweens.add({
        targets: this.kairo,
        x: 130,
        duration: 80,
        yoyo: true,
        repeat: 2
      });
    }

    this.updateHUD();

    this.time.delayedCall(750, () => {
      if (this.bossHP <= 0) {
        this.scene.start('ResultScene', { won: true });
      } else if (this.playerLives <= 0) {
        this.scene.start('ResultScene', { won: false });
      } else {
        this.isActing = false;
        this.cursorTween.resume();
      }
    });
  }
}