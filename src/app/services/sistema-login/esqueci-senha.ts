import { Injectable } from '@angular/core';
import { RequiemDosDeusesService } from '../requisicao-HTTP/requisicao';

@Injectable({
  providedIn: 'root'
})
export class EsqueciSenhaService {

  constructor(
    public rs: RequiemDosDeusesService
  ) { }

}
