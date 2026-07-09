import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Match } from '../../core/models/match';

@Component({
  selector: 'app-bracket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bracket.component.html',
  styleUrl: './bracket.component.scss',
})
export class BracketComponent {
  matches = input<Match[]>([]);

  // 1. EL FILTRO: Limpiamos los duplicados sin alterar el orden
  cleanMatches = computed(() => {
    const unicos: Match[] = [];
    const todos = [...this.matches()].sort(
      (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
    );

    todos.forEach(m => {
      const mTime = new Date(m.matchDate).getTime();
      const indexDuplicado = unicos.findIndex(u => new Date(u.matchDate).getTime() === mTime);

      if (indexDuplicado !== -1) {
        const u = unicos[indexDuplicado];
        const extFantasma = u.homeTeamId.startsWith('W') || u.awayTeamId.startsWith('W') || u.homeTeamId.startsWith('L');
        const nuevoFantasma = m.homeTeamId.startsWith('W') || m.awayTeamId.startsWith('W') || m.homeTeamId.startsWith('L');
        const mismoCruce = (u.homeTeamId === m.homeTeamId && u.awayTeamId === m.awayTeamId);

        // Si chocan horarios y son del mismo cruce o tienen códigos W/L
        if (extFantasma || nuevoFantasma || mismoCruce) {
          if (extFantasma && !nuevoFantasma) {
            unicos[indexDuplicado] = m; // Guardamos el real
          } else if (!extFantasma && nuevoFantasma) {
            // Ignoramos el fantasma
          } else {
            // Si hay dos iguales, priorizamos el que ya tiene goles (status)
            if (m.status > u.status) {
              unicos[indexDuplicado] = m;
            }
          }
          return;
        }
      }
      unicos.push(m);
    });
    return unicos;
  });

  // 2. MATRICES DE SLOTS (Las tuyas, intactas)
  private readonly orden16avosSlots = [
    ["GER", "PAR"], ["FRA", "SWE"], ["SA", "CAN"],  ["NED", "MAR"], 
    ["POR", "CRO"], ["SPN", "AUT"], ["USA", "BIH"], ["BEL", "SEN"], 
    ["BRA", "JPN"], ["CIV", "NOR"], ["MEX", "ECU"], ["ENG", "COD"], 
    ["ARG", "CPV"], ["AUS", "EGY"], ["SUI", "ALG"], ["COL", "GHA"]
  ];

  private readonly ordenOctavosSlots = [
    [...this.orden16avosSlots[0], ...this.orden16avosSlots[1], "W74", "W77"],
    [...this.orden16avosSlots[2], ...this.orden16avosSlots[3], "W73", "W75"],
    [...this.orden16avosSlots[4], ...this.orden16avosSlots[5], "W83", "W84"],
    [...this.orden16avosSlots[6], ...this.orden16avosSlots[7], "W81", "W82"],
    [...this.orden16avosSlots[8], ...this.orden16avosSlots[9], "W76", "W78"],
    [...this.orden16avosSlots[10], ...this.orden16avosSlots[11], "W79", "W80"],
    [...this.orden16avosSlots[12], ...this.orden16avosSlots[13], "W86", "W88"],
    [...this.orden16avosSlots[14], ...this.orden16avosSlots[15], "W85", "W87"]
  ];

  private readonly ordenCuartosSlots = [
    [...this.ordenOctavosSlots[0], ...this.ordenOctavosSlots[1], "W89", "W90"],
    [...this.ordenOctavosSlots[2], ...this.ordenOctavosSlots[3], "W93", "W94"],
    [...this.ordenOctavosSlots[4], ...this.ordenOctavosSlots[5], "W91", "W92"],
    [...this.ordenOctavosSlots[6], ...this.ordenOctavosSlots[7], "W95", "W96"]
  ];

  private readonly ordenSemisSlots = [
    [...this.ordenCuartosSlots[0], ...this.ordenCuartosSlots[1], "W97", "W98"],
    [...this.ordenCuartosSlots[2], ...this.ordenCuartosSlots[3], "W99", "W100"]
  ];

  // 3. TU FUNCIÓN DE ORDENAMIENTO (Con la lógica || que te funcionaba bien)
  private ordenarFase(partidos: Match[], slots: string[][]): Match[] {
    const ordenados: Match[] = [];
    let restantes = [...partidos]; 

    slots.forEach(opcionesSlot => {
      // Usamos el || que tenías originalmente
      const index = restantes.findIndex(m => 
        opcionesSlot.includes(m.homeTeamId) || opcionesSlot.includes(m.awayTeamId)
      );

      if (index !== -1) {
        ordenados.push(restantes[index]);
        restantes.splice(index, 1); 
      } else {
        // En lugar de devolver "...restantes" al final y romper el CSS, 
        // rellenamos con un molde vacío si falta el partido
        ordenados.push({ 
          id: 'fantasma-' + Math.random(), status: 0, 
          homeTeamId: opcionesSlot[opcionesSlot.length - 2] || 'TBD', 
          awayTeamId: opcionesSlot[opcionesSlot.length - 1] || 'TBD', 
          matchDate: '' 
        } as Match);
      }
    });

    return ordenados;
  }

  // 4. COMPUTED SIGNALS (Tus cortes exactos usando cleanMatches)
  roundOf32 = computed(() => {
    const partidos = this.cleanMatches().slice(72, 88);
    return this.ordenarFase(partidos, this.orden16avosSlots);
  });

  roundOf16 = computed(() => {
    const partidos = this.cleanMatches().slice(88, 96);
    return this.ordenarFase(partidos, this.ordenOctavosSlots);
  });

  quarterFinals = computed(() => {
    const partidos = this.cleanMatches().slice(96, 100);
    return this.ordenarFase(partidos, this.ordenCuartosSlots);
  });

  semiFinals = computed(() => {
    const partidos = this.cleanMatches().slice(100, 102);
    return this.ordenarFase(partidos, this.ordenSemisSlots);
  });

  // Usamos -2 y -1 para agarrar los dos últimos partidos de la lista sin importar la longitud total
  thirdPlace = computed(() => this.cleanMatches().slice(-2, -1)); 
  final = computed(() => this.cleanMatches().slice(-1));
  
  onImageError(event: any) {
    event.target.src = 'flags/xx.svg';
  }
}

// import { Component, input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Match } from '../../core/models/match';

// @Component({
//   selector: 'app-bracket',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './bracket.component.html',
//   styleUrl: './bracket.component.scss',
// })
// export class BracketComponent {
//   matches = input<Match[]>([]);

//   // Limpiamos duplicados de la API por conflictos de horario
//   cleanMatches = computed(() => {
//     const todos = [...this.matches()].sort(
//       (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
//     );
//     const unicos: Match[] = [];

//     todos.forEach(m => {
//       const mTime = new Date(m.matchDate).getTime();
//       const indexDuplicado = unicos.findIndex(u => new Date(u.matchDate).getTime() === mTime);

//       if (indexDuplicado !== -1) {
//         const existente = unicos[indexDuplicado];
//         const existenteEsFantasma = existente.homeTeamId.startsWith('W') || existente.awayTeamId.startsWith('W');
//         const nuevoEsFantasma = m.homeTeamId.startsWith('W') || m.awayTeamId.startsWith('W');

//         if (existenteEsFantasma || nuevoEsFantasma) {
//           if (existenteEsFantasma && !nuevoEsFantasma) {
//             unicos[indexDuplicado] = m;
//           }
//           return; 
//         }
//       }
//       unicos.push(m);
//     });
//     return unicos;
//   });

//   private readonly orden16avosSlots = [
//     ["GER", "PAR"], ["FRA", "SWE"], ["SA", "CAN"],  ["NED", "MAR"], 
//     ["POR", "CRO"], ["SPN", "AUT"], ["USA", "BIH"], ["BEL", "SEN"], 
//     ["BRA", "JPN"], ["CIV", "NOR"], ["MEX", "ECU"], ["ENG", "COD"], 
//     ["ARG", "CPV"], ["AUS", "EGY"], ["SUI", "ALG"], ["COL", "GHA"]
//   ];

//   private readonly ordenOctavosSlots = [
//     [...this.orden16avosSlots[0], ...this.orden16avosSlots[1], "W74", "W77"],
//     [...this.orden16avosSlots[2], ...this.orden16avosSlots[3], "W73", "W75"],
//     [...this.orden16avosSlots[4], ...this.orden16avosSlots[5], "W83", "W84"],
//     [...this.orden16avosSlots[6], ...this.orden16avosSlots[7], "W81", "W82"],
//     [...this.orden16avosSlots[8], ...this.orden16avosSlots[9], "W76", "W78"],
//     [...this.orden16avosSlots[10], ...this.orden16avosSlots[11], "W79", "W80"],
//     [...this.orden16avosSlots[12], ...this.orden16avosSlots[13], "W86", "W88"],
//     [...this.orden16avosSlots[14], ...this.orden16avosSlots[15], "W85", "W87"]
//   ];

//   private readonly ordenCuartosSlots = [
//     [...this.ordenOctavosSlots[0], ...this.ordenOctavosSlots[1], "W89", "W90"],
//     [...this.ordenOctavosSlots[2], ...this.ordenOctavosSlots[3], "W93", "W94"],
//     [...this.ordenOctavosSlots[4], ...this.ordenOctavosSlots[5], "W91", "W92"],
//     [...this.ordenOctavosSlots[6], ...this.ordenOctavosSlots[7], "W95", "W96"]
//   ];

//   private readonly ordenSemisSlots = [
//     [...this.ordenCuartosSlots[0], ...this.ordenCuartosSlots[1], "W97", "W98"],
//     [...this.ordenCuartosSlots[2], ...this.ordenCuartosSlots[3], "W99", "W100"]
//   ];

//   // 3. EL MOTOR DE CONSUMO (Extrae y borra para no repetir)
//   bracketPhases = computed(() => {
//     const pool = [...this.cleanMatches()].sort(
//       (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
//     );
    
//     // Eliminamos los 72 de fase de grupos
//     pool.splice(0, 72);

//     const extraerFase = (slots: string[][]) => {
//       const fase: Match[] = [];
//       slots.forEach(opcionesSlot => {
//         const index = pool.findIndex(m => 
//           opcionesSlot.includes(m.homeTeamId) && opcionesSlot.includes(m.awayTeamId)
//         );

//         if (index !== -1) {
//           fase.push(pool[index]);
//           pool.splice(index, 1); 
//         } else {
//           fase.push({ 
//             id: 'fantasma-' + Math.random(), status: 0, 
//             homeTeamId: opcionesSlot[opcionesSlot.length - 2] || 'TBD', 
//             awayTeamId: opcionesSlot[opcionesSlot.length - 1] || 'TBD', 
//             matchDate: '' 
//           } as Match);
//         }
//       });
//       return fase;
//     };

//     const r32 = extraerFase(this.orden16avosSlots);
//     const r16 = extraerFase(this.ordenOctavosSlots);
//     const qf = extraerFase(this.ordenCuartosSlots);
//     const sf = extraerFase(this.ordenSemisSlots);

//     pool.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

//     const third = pool.length > 0 ? [pool[0]] : [];
//     const final = pool.length > 1 ? [pool[1]] : [];

//     return { r32, r16, qf, sf, third, final };
//   });

//   // 4. SEÑALES PARA EL HTML
//   roundOf32 = computed(() => this.bracketPhases().r32);
//   roundOf16 = computed(() => this.bracketPhases().r16);
//   quarterFinals = computed(() => this.bracketPhases().qf);
//   semiFinals = computed(() => this.bracketPhases().sf);
//   thirdPlace = computed(() => this.bracketPhases().third);
//   final = computed(() => this.bracketPhases().final);

//   onImageError(event: any) {
//     event.target.src = 'assets/flags/placeholder.svg';
//   }
// }