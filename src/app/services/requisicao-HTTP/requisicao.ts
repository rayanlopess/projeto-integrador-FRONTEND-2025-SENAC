import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RequiemDosDeusesService {

  private baseUrl = 'https://projeto-integrador-backend-2025-senac.onrender.com'; // Adicione http://

  constructor(public http: HttpClient) { }

  get(endpoint: string, dados: any) {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      params: dados // Passe os dados diretamente como params
    });
  }

  post(endpoint: string, formData: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json', // Geralmente melhor usar JSON
        'Accept': 'application/json'
      })
    };
    
    // Se realmente precisa de FormData, remova o Content-Type para o browser definir automaticamente
    return this.http.post(`${this.baseUrl}${endpoint}`, formData, httpOptions);
  }
}
