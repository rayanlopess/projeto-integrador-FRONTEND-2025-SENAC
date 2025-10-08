import { Injectable } from '@angular/core';
import { RequiemDosDeusesService } from '../requisicao-HTTP/requisicao';

@Injectable({
  providedIn: 'root'
})
export class CadastroService {

  constructor(
    public rs: RequiemDosDeusesService
  ) { }

  


}
