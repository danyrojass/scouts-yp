import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';

import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';

import {environment} from '../environments/environment';

const APP_PROVIDERS: ApplicationConfig['providers'] = [
    // Angular runtime
    provideZoneChangeDetection({ eventCoalescing: true }),

    // App platform features
    provideRouter(routes),
    provideHttpClient(),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
];

export const appConfig: ApplicationConfig = {
    providers: APP_PROVIDERS,
};