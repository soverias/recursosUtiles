import { Component, OnInit } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

@Component({
  selector: 'app-bang-game',
  imports: [],
  templateUrl: './bang-game.html',
  styleUrl: './bang-game.css'
})
export class BangGame implements OnInit {
  private connection: HubConnection;


  constructor() {

    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5253/banghub')
      .build();

    this.connection.on("Status", message => this.Status(message));
    this.connection.on("SecondsRemaining", message => this.SecondsRemaining(message));
    this.connection.on("Winner", message => this.Winner(message));
    this.connection.on("Loser", message => this.Loser(message));
  }

  ngOnInit(): void {
    // Initialization logic for the Bang game can go here
    this.connection.start()
      .then(_ => {
        this.join();
      }).catch(error => {
        return console.error(error);
      });
    window.requestAnimationFrame(this.draw.bind(this)); // Start the drawing loop
  }

  public join() {
    this.connection.invoke('JoinGroup', "testName")
      .then(_ => {
      });
  }

  public setPlayerReady() {
    this.connection.invoke('PlayerReady')
      .then(_ => {
      });
  }

  public Shoot() {
    this.connection.invoke('PlayerShoot')
      .then(_ => {
        console.log(`Shoot group:`);
      });
  }

  private Status(message: string) {
    console.log('Status message received:', message);
  }

  private SecondsRemaining(seconds: number) {
    if (seconds <= 0)
      this.secondsRemaining = new BangNumber(200, 200, "shoot!");
    else
      this.secondsRemaining = new BangNumber(200, 200, seconds.toString());
  }
  
  private Winner(message: boolean) {
    console.log('Are you winner?:', message);
  }

  private Loser(message: boolean) {
    console.log('Are you winner?:', message);
  }

  secondsRemaining: DrawComponent = new BangNumber(200, 200, "3");
  draw(): void {

    let c = document.getElementById("gameCanvas") as HTMLCanvasElement;
    let ctx = c!.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, c.width, c.height); // Clear the canvas
    this.secondsRemaining.Prepare().draw(ctx); // Draw the component


    window.requestAnimationFrame(this.draw.bind(this)); // Use bind to maintain context
  }

  // Add methods and properties specific to the Bang game here
  startGame(): void {
    console.log('Bang game started!');
  }

  endGame(): void {
    console.log('Bang game ended!');
  }

}

abstract class DrawComponent {
  abstract Prepare(): DrawComponent;
  abstract draw(context: CanvasRenderingContext2D): void;
}

abstract class textDrawComponent extends DrawComponent {
  protected text: string;
  protected x: number;
  protected y: number;
  protected fontsize: number = 16; // Default font size
  protected fontfamily: string = "Arial"; // Default font family

  color: string = "black";
  constructor(
    x: number = 0,
    y: number = 0,
    text: string
  ) {
    super();
    this.text = text;
    this.x = x;
    this.y = y;
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.font = this.fontsize + "px " + this.fontfamily;
    context.fillStyle = this.color;
    context.fillText(this.text, this.x, this.y);
  }
}


class BangNumber extends textDrawComponent {
  speed: number = 1; // Default speed
  constructor(x: number, y: number, text: string) {
    super(x, y, text);
  }

  override Prepare(): BangNumber {
    if (this.fontsize < 100) {
      // Preparation logic for BangNumber can go here
      this.fontsize += this.speed;
    }
    return this;
  }
}