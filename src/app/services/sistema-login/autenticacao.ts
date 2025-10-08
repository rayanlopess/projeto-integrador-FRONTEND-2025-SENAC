import { Injectable } from '@angular/core';
import { RequiemDosDeusesService } from '../requisicao-HTTP/requisicao';  
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutenticacaoService {
    
  constructor(public rs: RequiemDosDeusesService) { }



}
