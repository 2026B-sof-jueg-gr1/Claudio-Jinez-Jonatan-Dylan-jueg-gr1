import { SoundFX } from '../utils/SoundFX.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.input.once('pointerdown', () => SoundFX.playBGM('menu'));
    this.input.keyboard.once('keydown', () => SoundFX.playBGM('menu'));

    // Fondo oscuro moderno con acentos geométricos sutiles
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0d14);
    this.add.circle(110, 120, 140, 0x00f5d4, 0.06);
    this.add.circle(width - 90, height - 110, 160, 0xff006e, 0.06);

    // Etiqueta superior moderna
    this.add.text(width / 2, 110, 'EDICIÓN DEFINITIVA  •  ARCADE RPG', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      letterSpacing: 3,
      color: '#00f5d4'
    }).setOrigin(0.5);

    // Título limpio con efecto de profundidad
    const title = this.add.text(width / 2, 162, 'INKBREAKER', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '58px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#00f5d4',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, 212, 'EL ÚLTIMO TRAZO', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      letterSpacing: 8,
      color: '#ff006e'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 168,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Botón principal moderno
    const btnBg = this.add.graphics();
    const drawBtn = (color) => {
      btnBg.clear();
      btnBg.fillStyle(color, 1);
      btnBg.fillRoundedRect(width / 2 - 125, 275, 250, 56, 14);
    };
    drawBtn(0x00f5d4);

    const btnZone = this.add.zone(width / 2, 303, 250, 56).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(width / 2, 303, 'JUGAR AHORA', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#07080d'
    }).setOrigin(0.5);

    btnZone.on('pointerover', () => {
      drawBtn(0xff006e);
      btnTxt.setColor('#ffffff');
    });
    btnZone.on('pointerout', () => {
      drawBtn(0x00f5d4);
      btnTxt.setColor('#07080d');
    });
    btnZone.on('pointerdown', () => {
      SoundFX.play('shard');
      this.scene.start('PlayScene', { level: 1, lives: 3, xp: 0, rpgLevel: 1 });
    });

    // Tarjeta informativa de historia corta
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.04);
    card.lineStyle(1, 0xffffff, 0.1);
    card.fillRoundedRect(62, 375, width - 124, 115, 14);
    card.strokeRoundedRect(62, 375, width - 124, 115, 14);

    this.add.text(width / 2, 432,
      'Recupera los 3 White Shards en cada mural, sube de nivel\nRPG y derrota a El Borrón antes de que borre la ciudad.',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '15px',
        color: '#cbd5e1',
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5);

    // Botón de audio discreto
    const audioTxt = this.add.text(width - 18, 18, '🔊 MÚSICA: ON', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#cbd5e1'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    audioTxt.on('pointerdown', () => {
      const m = SoundFX.toggleMute();
      audioTxt.setText(m ? '🔇 MÚSICA: OFF' : '🔊 MÚSICA: ON');
    });

    this.add.text(width / 2, 540, 'Haz clic para activar la banda sonora electrónica', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#64748b'
    }).setOrigin(0.5);
  }
}