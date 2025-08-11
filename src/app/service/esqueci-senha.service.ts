import { Injectable } from '@angular/core';
import { RequiemDosDeusesService } from './requisicao.service';

@Injectable({
  providedIn: 'root'
})
export class EsqueciSenhaService {

  constructor(
    public rs: RequiemDosDeusesService
  ) { }

  esqueciSenha(email: string) {
    const fd = new FormData();
    fd.append('services', ''); //indicar qual service será utilizado
    fd.append('email', email);
 
    
    return this.rs.post(fd);

  }
}
