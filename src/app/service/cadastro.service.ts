import { Injectable } from '@angular/core';
import { RequiemDosDeusesService } from './requisicao.service';

@Injectable({
  providedIn: 'root'
})
export class CadastroService {

  constructor(
    public rs: RequiemDosDeusesService
  ) { }

    cadastro(email: string, login: string, senha: string, nome: string, cpf: string,  nascimento: string) {
      const fd = new FormData();
      fd.append('services', 'addUserService')
      fd.append('login', login);
      fd.append('senha', senha);
      fd.append('email', email);
      fd.append('nome', nome);
      fd.append('cpf', cpf);
      fd.append('nascimento', nascimento);
      
      return this.rs.post(fd);

    }


}
