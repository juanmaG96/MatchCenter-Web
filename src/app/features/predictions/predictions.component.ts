import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchService } from '../../core/services/match.service';
import { Match, MatchStatus } from '../../core/models/match';

@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predictions.component.html',
  styleUrl: './predictions.component.scss'
})
export class PredictionsComponent implements OnInit {
  private readonly matchService = inject(MatchService);

  matches = signal<Match[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Dictionary map to hold input scores
  predictionScores = new Map<string, { home: number; away: number }>();

  ngOnInit(): void {
    this.loadScheduledMatches();
  }

  loadScheduledMatches(): void {
    this.matchService.getMatches().subscribe({
      next: (data) => {
        const scheduled = data.filter(m => m.status === MatchStatus.Scheduled);
        this.matches.set(scheduled);
        scheduled.forEach(m => {
          this.predictionScores.set(m.id, { home: 0, away: 0 });
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load scheduled matches.');
        this.loading.set(false);
      }
    });
  }

  getPredictionModel(matchId: string) {
    if (!this.predictionScores.has(matchId)) {
      this.predictionScores.set(matchId, { home: 0, away: 0 });
    }
    return this.predictionScores.get(matchId)!;
  }

  submitPrediction(matchId: string): void {
    const scores = this.getPredictionModel(matchId);
    this.matchService.createPrediction(matchId, scores.home, scores.away).subscribe({
      next: () => {
        this.successMessage.set(`¡Predicción enviada con éxito!`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        const serverError = err.error?.message || 'Error al enviar la predicción. Asegúrate de estar autenticado.';
        this.error.set(serverError);
        setTimeout(() => this.error.set(null), 4000);
      }
    });
  }
}
