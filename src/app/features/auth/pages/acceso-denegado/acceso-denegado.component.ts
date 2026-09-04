import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './acceso-denegado.component.html',
  styleUrl: './acceso-denegado.component.scss',
})
export class AccesoDenegadoComponent {}
