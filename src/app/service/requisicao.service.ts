import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RequiemDosDeusesService {

  constructor(
    public http:HttpClient
  ) { }

  get(dados:any){
    return this.http.get('/', {
      params: {
        _dados:dados
      }
    })
  }

  post(formData:any){
    const httpOptions = {
      headers: new HttpHeaders({
        'Access-Control-Allow-Origin': '*'
      })
    };
    return this.http.post('/', formData, httpOptions);
  }

}
