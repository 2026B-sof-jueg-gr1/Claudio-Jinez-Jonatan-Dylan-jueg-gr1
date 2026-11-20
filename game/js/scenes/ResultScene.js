export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.won = data.won || false;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x10121a);

    const title = this.won ? '¡MURAL RECUPERADO!' : 'TINTA FUERA DE CONTROL';
    const color = this.won ? '#00f5d4' : '#ff006e';

    this.add.text(width / 2, 180, title, {
      fontSize: '36px',
      fontStyle: 'bold',
      color
    }).setOrigin(0.5);

    // Botón Reintentar
    const retryBtn = this.add.rectangle(width / 2, 300, 220, 52, 0x00f5d4)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 300, 'REINTENTAR', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#0b0c10'
    }).setOrigin(0.5);

    retryBtn.on('pointerdown', () => this.scene.start('PlayScene'));

    // Botón Menú
    const menuBtn = this.add.rectangle(width / 2, 375, 220, 52, 0x2a2d3d)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 375, 'MENÚ PRINCIPAL', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}