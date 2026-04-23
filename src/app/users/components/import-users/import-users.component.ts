import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import * as XLSX from 'xlsx';
import {UserService} from '../../services/user.service';
import {UserLevel, UserType} from '../../models';
import {LoadingSpinnerComponent} from '../../../shared/components';

interface ParsedUser {
    name: string;
    email: string;
    dateOfBirth: string;
    type: string;
    level: string;
    groupId: string | null;
    setId: string | null;
}

@Component({
    selector: 'app-import-users',
    standalone: true,
    imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
    templateUrl: './import-users.component.html',
    styleUrls: ['./import-users.component.css']
})
export class ImportUsersComponent {
    private userService = inject(UserService);

    fileSelected: File | null = null;
    previewData: ParsedUser[] = [];
    isLoading = signal(false);
    successMessage = '';
    errorMessage = '';
    importResult: {success: number; failed: number} | null = null;

    allowedUserTypes = Object.values(UserType);
    allowedUserLevels = Object.values(UserLevel);

    allowedColumns = [
        'name',
        'email',
        'dateOfBirth',
        'type',
        'level',
        'groupId',
        'setId'
    ];

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

        if (!validExtensions.includes(extension)) {
            this.errorMessage = 'Solo se permiten archivos CSV o Excel';
            return;
        }

        this.fileSelected = file;
        this.errorMessage = '';
        this.successMessage = '';
        this.importResult = null;

        this.parseFile(file);
    }

    private parseFile(file: File): void {
        this.isLoading.set(true);

        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, {type: 'binary'});
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1}) as string[][];

                if (jsonData.length < 2) {
                    this.errorMessage = 'El archivo debe contener encabezados y al menos un registro';
                    this.isLoading.set(false);
                    return;
                }

                const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
                const validHeaders = this.allowedColumns.filter(col =>
                    headers.some(h => h === col || h === col.replace(/Id$/, '_id'))
                );

                if (!validHeaders.includes('name') || !validHeaders.includes('email')) {
                    this.errorMessage = 'Las columnas "name" y "email" son obligatorias';
                    this.isLoading.set(false);
                    return;
                }

                const parsed: ParsedUser[] = [];
                const nameIndex = headers.findIndex(h => h === 'name');
                const emailIndex = headers.findIndex(h => h === 'email');
                const dobIndex = headers.findIndex(h => h.includes('dateofbirth') || h.includes('date'));
                const typeIndex = headers.findIndex(h => h === 'type');
                const levelIndex = headers.findIndex(h => h === 'level');
                const groupIndex = headers.findIndex(h => h === 'group_id' || h === 'groupid');
                const setIndex = headers.findIndex(h => h === 'set_id' || h === 'setid');

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row[nameIndex] && !row[emailIndex]) continue;

                    parsed.push({
                        name: String(row[nameIndex] || '').trim(),
                        email: String(row[emailIndex] || '').trim(),
                        dateOfBirth: dobIndex >= 0 ? String(row[dobIndex] || '') : '',
                        type: typeIndex >= 0 ? this.normalizeField(String(row[typeIndex]), this.allowedUserTypes) : this.allowedUserTypes[0],
                        level: levelIndex >= 0 ? this.normalizeField(String(row[levelIndex]), this.allowedUserLevels) : this.allowedUserLevels[0],
                        groupId: groupIndex >= 0 && row[groupIndex] ? String(row[groupIndex]).trim() : null,
                        setId: setIndex >= 0 && row[setIndex] ? String(row[setIndex]).trim() : null
                    });
                }

                this.previewData = parsed;
                this.isLoading.set(false);
            } catch (error) {
                this.errorMessage = 'Error al procesar el archivo';
                this.isLoading.set(false);
            }
        };

        reader.onerror = () => {
            this.errorMessage = 'Error al leer el archivo';
            this.isLoading.set(false);
        };

        reader.readAsBinaryString(file);
    }

    private normalizeField(value: string | undefined, validValues: string[]): string {
        if (!value) return validValues[0];
        const normalized = String(value).trim();
        const found = validValues.find(v =>
            v.toLowerCase() === normalized.toLowerCase() ||
            v.toLowerCase().replace(' ', '') === normalized.toLowerCase().replace(' ', '')
        );
        return found || validValues[0];
    }

    async importUsers(): Promise<void> {
        const users = this.previewData;
        if (users.length === 0) return;

        this.isLoading.set(true);
        this.errorMessage = '';
        this.successMessage = '';

        let success = 0;
        let failed = 0;

        for (const user of users) {
            try {
                await this.userService.createUser({
                    name: user.name,
                    email: user.email,
                    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
                    type: user.type as UserType,
                    level: user.level as UserLevel,
                    groupId: user.groupId,
                    setId: user.setId,
                    createdAt: new Date()
                });
                success++;
            } catch (error) {
                console.error('Error importing user:', user.email, error);
                failed++;
            }
        }

        this.importResult = {success, failed};
        this.successMessage = `Se importaron ${success} usuarios correctamente`;
        this.isLoading.set(false);
        this.fileSelected = null;
        this.previewData = [];
    }

    clearFile(): void {
        this.fileSelected = null;
        this.previewData = [];
        this.errorMessage = '';
        this.successMessage = '';
        this.importResult = null;
    }
}