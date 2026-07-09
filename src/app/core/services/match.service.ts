import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Match } from '../models/match';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Matches`;

  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(this.apiUrl);
  }

  createPrediction(matchId: string, homePredictedScore: number, awayPredictedScore: number): Observable<string> {
    const url = `${this.apiUrl}/${matchId}/predict`;
    return this.http.post<string>(url, { homePredictedScore, awayPredictedScore });
  }
}
