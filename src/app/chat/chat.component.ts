import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from './model/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;
  public conectado: boolean = false;

  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];

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
        this.mensajes.push(mensaje);
        console.log(mensaje);
      });
    }

    this.client.onDisconnect = (frame) => {
      console.log('Desconectados: ' + !this.client.connected + " : " + frame);
      this.conectado = false;
    }
  }

  conectar(): void{
    this.client.activate();
  }

  desconectar(): void{
    this.client.deactivate();
  }

  enviarMensaje(): void{
    if (this.mensaje.texto.trim() == '')
      return;
    this.client.publish({
      destination: '/app/mensaje',
      body: JSON.stringify(this.mensaje)
    });
    this.mensaje.texto = '';
  }
}
