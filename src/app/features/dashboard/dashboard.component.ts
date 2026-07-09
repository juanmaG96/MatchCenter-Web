import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchService } from '../../core/services/match.service';
import { Match } from '../../core/models/match';
import { MatchRowComponent } from '../../shared/components/match-row/match-row.component';
import { BracketComponent } from '../bracket/bracket.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatchRowComponent, BracketComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly matchService = inject(MatchService);

  matches = signal<Match[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Limpiamos los duplicados "fantasma" que manda la API
  cleanMatches = computed(() => {
    const unicos: Match[] = [];
    const todos = [...this.matches()].sort(
      (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
    );

    todos.forEach(m => {
      const mTime = new Date(m.matchDate).getTime();
      const indexDuplicado = unicos.findIndex(u => new Date(u.matchDate).getTime() === mTime);

      if (indexDuplicado !== -1) {
        const existente = unicos[indexDuplicado];
        const extFantasma = existente.homeTeamId.startsWith('W') || existente.awayTeamId.startsWith('W') || existente.homeTeamId.startsWith('L');
        const nuevoFantasma = m.homeTeamId.startsWith('W') || m.awayTeamId.startsWith('W') || m.homeTeamId.startsWith('L');

        if (extFantasma && !nuevoFantasma) {
          unicos[indexDuplicado] = m; // Reemplazamos fantasma por real
          return;
        } else if (!extFantasma && nuevoFantasma) {
          return; // Ignoramos el fantasma nuevo
        } else {
          // Si ambos son reales (ej: dos USA vs BIH), nos quedamos con el que tiene mayor status (Finished > Scheduled)
          if (m.status > existente.status) {
            unicos[indexDuplicado] = m;
          }
          return; 
        }
      }
      unicos.push(m);
    });

    return unicos;
  });

  // Ahora usamos this.cleanMatches() para agruparlos
  groupedMatches = computed(() => {
    const groups: { [key: string]: Match[] } = {};
    
    // Usamos la lista limpia y sin fantasmas
    const sorted = this.cleanMatches();

    sorted.forEach(match => {
      const localDate = new Date(match.matchDate);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(match);
    });

    return Object.keys(groups).map(date => ({
      date,
      matches: groups[date]
    }));
  });

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.loading.set(true);
    this.error.set(null);
    this.matchService.getMatches().subscribe({
      next: (data) => {
        this.matches.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load matches. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadMatches();
  }
}