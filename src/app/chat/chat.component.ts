import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from './model/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('scrollChat') comment: ElementRef;
  scrolltop:number = 0;

  private client: Client;
  public conectado: boolean = false;

  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];

  escribiendo: string;

  constructor() { }

  ngOnInit(): void {
    this.client = new Client();
    this.client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/chat-websocket");
    }

    this.client.onConnect = (frame) => {
      console.log('Conectados: ' + this.client.connected + " : " + frame);
      this.conectado = true;

      this.client.subscribe('/chat/mensaje', e => {
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        mensaje.fecha = new Date(mensaje.fecha);

        if (!this.mensaje.color &&
          mensaje.tipo == 'USUARIO_NUEVO' &&
          this.mensaje.username == mensaje.username){
          this.mensaje.color = mensaje.color;
        }

        this.mensajes.push(mensaje);

        setTimeout(()=>{
          if(this.comment !== undefined){
              this.scrolltop = this.comment.nativeElement.scrollHeight;
          }
        },100);

        console.log(mensaje);
      });

      this.client.subscribe('/chat/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo = '', 3000);
      });

      this.mensaje.tipo = 'USUARIO_NUEVO';
      this.client.publish({
        destination: '/app/mensaje',
        body: JSON.stringify(this.mensaje)
      });

    }

    this.client.onDisconnect = (frame) => {
      console.log('Desconectados: ' + !this.client.connected + " : " + frame);
      this.conectado = false;
    }
  }

  conectar(): void{
    if (this.mensaje.username.trim() == '')
      return;
    this.client.activate();
  }

  desconectar(): void{
    this.client.deactivate();
  }

  enviarMensaje(): void{
    if (this.mensaje.texto.trim() == '')
      return;
      this.mensaje.tipo = 'MENSAJE';
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.mensaje)
    });
    this.mensaje.texto = '';
  }

  escribiendoEvento(): void{
    this.client.publish({
      destination: '/app/escribiendo',
      body: this.mensaje.username
    });
  }
}
