import { Injectable } from '@angular/core';
import { RequiemDosDeusesService } from './requisicao.service';

@Injectable({
  providedIn: 'root'
})
export class AutenticacaoService {

  constructor(
    public rs: RequiemDosDeusesService
  ) { }

    logar(login: string, senha: string) {
      const fd = new FormData();
      fd.append('services', 'getUserService')
      fd.append('login', login);
      fd.append('senha', senha);
      
      return this.rs.post(fd);

    }

    validarToken(token: string) {
     
    }

}
