import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'app-pantry-photo-upload',
  imports: [TranslatePipe],
  templateUrl: './photo-upload.html',
  styleUrl: './photo-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoUpload {
  readonly busy = input(false);
  readonly preview = input<string | null>(null);
  readonly filename = input('');
  readonly fileSelected = output<File>();
  readonly analyze = output<void>();
  readonly hasPhoto = input(false);
  choose(event: Event) {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (file) this.fileSelected.emit(file);
    el.value = '';
  }
}
