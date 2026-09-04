/**
 * Barrel de módulos standalone de Angular Material.
 * Importar MATERIAL_IMPORTS en el arreglo `imports` de cualquier componente
 * standalone que necesite componentes de UI de Material, evitando repetir
 * imports individuales en cada archivo.
 *
 * Uso:
 *   import { MATERIAL_IMPORTS } from '@app/shared/material';
 *
 *   @Component({
 *     ...
 *     imports: [...MATERIAL_IMPORTS],
 *   })
 */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

export const MATERIAL_IMPORTS = [
  MatToolbarModule,
  MatSidenavModule,
  MatButtonModule,
  MatIconModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatSnackBarModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCardModule,
  MatMenuModule,
  MatListModule,
  MatProgressSpinnerModule,
  MatChipsModule,
] as const;
