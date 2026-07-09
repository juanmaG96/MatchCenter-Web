import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Match } from '../../../core/models/match';

@Component({
  selector: 'app-match-row',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './match-row.component.html',
  styleUrl: './match-row.component.scss'
})
export class MatchRowComponent {
  match = input.required<Match>();

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    
    // Solo reemplazamos si la imagen actual NO es ya la de error.
    // Esto evita el bucle infinito si 'xx.svg' llega a faltar.
    if (!element.src.includes('xx.svg')) {
      element.src = 'flags/xx.svg';
    }
  }

  exportToCalendar(): void {
    const match = this.match();
    // Instanciamos las fechas. Asumimos que un partido dura aprox 2 horas.
    const startDate = new Date(match.matchDate);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));

    // Formato requerido por iCalendar (YYYYMMDDTHHMMSSZ) en UTC puro
    const formatIcsDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Estructura del archivo .ics
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MatchCenter 2026//ES',
      'BEGIN:VEVENT',
      `SUMMARY:Mundial 2026: ${match.homeTeamName} vs ${match.awayTeamName}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `DESCRIPTION:Partido de la Copa del Mundo 2026. ¡No te lo pierdas!`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    // Generamos el archivo y forzamos la descarga en el navegador
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mundial_${match.homeTeamId}_vs_${match.awayTeamId}.ics`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiamos la memoria
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  
}
