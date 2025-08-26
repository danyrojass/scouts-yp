import {Component, EventEmitter, Input, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() message = signal('');
  @Input() dismissible = signal(true);
  @Output() dismiss: EventEmitter<void> = new EventEmitter<void>();

  onDismiss(): void {
    this.dismiss.emit();
  }
}
