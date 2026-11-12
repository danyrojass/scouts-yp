#!/usr/bin/env node
/**
 * Carga histórica de actividades y puntajes por patrulla en Firestore.
 *
 * Crea en la colección `activities` una actividad por fecha (nivel Scout) y en
 * `activity-completion` una completion por patrulla con sus puntos.
 *
 * Es idempotente: los IDs de documento son determinísticos, así que correrlo
 * dos veces sobreescribe los mismos documentos en vez de duplicar datos.
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed:activities
 *   npm run seed:activities -- --dry-run          # muestra qué haría, sin escribir
 *   npm run seed:activities -- --user=<uid>       # atribuye las completions a un usuario
 *   npm run seed:activities -- --key=./sa.json    # ruta explícita a la service account
 *
 * La service account se descarga desde Firebase Console → Configuración del
 * proyecto → Cuentas de servicio → Generar nueva clave privada.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {applicationDefault, cert, initializeApp} from 'firebase-admin/app';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';

const DEFAULT_PROJECT_ID = 'scout-app-7b912';
const LEVEL = 'Scout';
const SET_TYPE = 'Patrulla';
/** Las fechas se anclan al mediodía en Paraguay (UTC-3) para que no se corran de día. */
const TZ_OFFSET = '-03:00';

/**
 * Datos históricos. `points` de la actividad = máximo puntaje entre patrullas,
 * porque el formulario de la app limita los puntos ganados a ese máximo.
 */
const ACTIVITIES = [
    {
        date: '2026-10-10',
        name: 'Carrera codificada',
        key: 'carrera-codificada',
        scores: {Aguara: 3, Halcón: 2, Lobo: 1},
    },
    {
        date: '2026-10-10',
        name: 'Maestros del código',
        key: 'maestros-del-codigo',
        scores: {Aguara: 1, Halcón: 3, Lobo: 2},
    },
    {
        date: '2026-10-10',
        name: 'Mensaje perdido',
        key: 'mensaje-perdido',
        scores: {Aguara: 3, Halcón: 1, Lobo: 2},
    },
    {
        date: '2026-08-07',
        name: 'Competencia de avioncitos de papel',
        key: 'competencia-avioncitos-de-papel',
        scores: {Aguara: 3, Halcón: 3, Lobo: 3},
    },
    {
        date: '2026-06-06',
        name: 'Armado de carpas',
        key: 'armado-de-carpas',
        scores: {Aguara: 1, Halcón: 3, Lobo: 2},
    },
    {
        date: '2026-04-18',
        name: 'Entrega de canto de patrulla',
        key: 'entrega-de-canto-de-patrulla',
        scores: {Aguara: 2, Halcón: 2, Lobo: 1},
    },
    {
        date: '2026-04-18',
        name: 'Cosas completas y en orden',
        key: 'cosas-completas-y-en-orden',
        scores: {Aguara: 0, Halcón: 2, Lobo: 1},
    },
    {
        date: '2026-04-11',
        name: 'Bordona envenenada',
        key: 'bordona-envenenada',
        scores: {Aguara: 3, Halcón: 2, Lobo: 1},
    },
];

function parseArgs(argv) {
    const args = {dryRun: false, user: null, key: null, project: null};
    for (const arg of argv) {
        if (arg === '--dry-run') args.dryRun = true;
        else if (arg === '--help' || arg === '-h') args.help = true;
        else if (arg.startsWith('--user=')) args.user = arg.slice('--user='.length);
        else if (arg.startsWith('--key=')) args.key = arg.slice('--key='.length);
        else if (arg.startsWith('--project=')) args.project = arg.slice('--project='.length);
    }
    return args;
}

/** Normaliza nombres para matchear "Halcón" con "Halcon", mayúsculas, espacios, etc. */
function normalize(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function activityDate(date) {
    return Timestamp.fromDate(new Date(`${date}T12:00:00${TZ_OFFSET}`));
}

function maxPoints(scores) {
    return Math.max(...Object.values(scores));
}

function printHelp() {
    console.log(`
Carga histórica de actividades y puntajes en Firestore.

  --dry-run          Muestra el plan sin escribir en Firestore
  --user=<uid>       Atribuye las completions a ese usuario (default: primer Dirigente)
  --key=<ruta>       Service account JSON (default: GOOGLE_APPLICATION_CREDENTIALS)
  --project=<id>     Project ID (default: ${DEFAULT_PROJECT_ID})

Ejemplo:
  GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed:activities -- --dry-run
`);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return;
    }

    const projectId = args.project ?? process.env.FIREBASE_PROJECT_ID ?? DEFAULT_PROJECT_ID;
    const keyPath = args.key ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let credential;
    if (keyPath) {
        const absolute = resolve(keyPath);
        credential = cert(JSON.parse(readFileSync(absolute, 'utf8')));
        console.log(`Credencial: ${absolute}`);
    } else {
        credential = applicationDefault();
        console.log('Credencial: Application Default Credentials');
    }

    initializeApp({credential, projectId});
    const db = getFirestore();

    console.log(`Proyecto:   ${projectId}`);
    console.log(`Modo:       ${args.dryRun ? 'DRY RUN (sin escrituras)' : 'escritura'}\n`);

    // --- Sets reales: matcheamos por nombre, priorizando tipo Patrulla ---
    const setsSnap = await db.collection('sets').get();
    const sets = setsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    const patrols = sets.filter(set => normalize(set.type) === normalize(SET_TYPE));
    const candidates = patrols.length > 0 ? patrols : sets;

    const neededNames = [...new Set(ACTIVITIES.flatMap(a => Object.keys(a.scores)))];
    const setsByName = new Map();
    const missing = [];

    for (const name of neededNames) {
        const matches = candidates.filter(set => normalize(set.name) === normalize(name));
        if (matches.length === 1) setsByName.set(name, matches[0]);
        else if (matches.length === 0) missing.push(name);
        else missing.push(`${name} (ambiguo: ${matches.map(s => s.id).join(', ')})`);
    }

    if (missing.length > 0) {
        console.error('No pude resolver estos sets en Firestore:');
        for (const item of missing) console.error(`  - ${item}`);
        console.error('\nSets disponibles:');
        for (const set of sets) {
            console.error(`  - ${set.name} (${set.type}) id=${set.id}`);
        }
        process.exitCode = 1;
        return;
    }

    // --- Usuario al que se atribuyen las completions (no afecta los puntajes) ---
    let userId = args.user;
    if (!userId) {
        const dirigente = await db.collection('users').where('type', '==', 'Dirigente').limit(1).get();
        userId = dirigente.empty ? '' : dirigente.docs[0].id;
        if (!userId) {
            console.warn('Aviso: no encontré ningún Dirigente; las completions quedan con user_id vacío.');
        }
    }

    console.log('Sets resueltos:');
    for (const name of neededNames) {
        const set = setsByName.get(name);
        console.log(`  ${name} -> ${set.name} (id=${set.id})`);
    }
    console.log(`Usuario de las completions: ${userId || '(vacío)'}\n`);

    const activityWrites = [];
    const completionWrites = [];

    for (const activity of ACTIVITIES) {
        const activityId = `${activity.key}-${activity.date.replace(/-/g, '')}`;
        const points = maxPoints(activity.scores);
        const when = activityDate(activity.date);

        activityWrites.push({
            id: activityId,
            data: {
                name: activity.name,
                key: activity.key,
                level: LEVEL,
                points,
                created_at: when,
                scheduled_at: when,
            },
        });

        for (const [setName, earnedPoints] of Object.entries(activity.scores)) {
            const set = setsByName.get(setName);
            const completion = {
                activity_id: activityId,
                set_id: set.id,
                user_id: userId,
                completed_at: when,
                earned_points: earnedPoints,
            };
            if (set.group_id) completion.group_id = set.group_id;

            completionWrites.push({
                id: `${activityId}__${set.id}`,
                data: completion,
            });
        }
    }

    for (const write of activityWrites) {
        console.log(`[actividad]  ${write.data.name} (${write.data.points} pts) -> activities/${write.id}`);
    }
    console.log('');
    for (const write of completionWrites) {
        console.log(
            `[completion] ${write.data.activity_id} | set=${write.data.set_id} | ${write.data.earned_points} pts -> activity-completion/${write.id}`
        );
    }

    if (args.dryRun) {
        console.log(`\nDry run: ${activityWrites.length} actividades y ${completionWrites.length} completions listas. Nada escrito.`);
        return;
    }

    const batch = db.batch();
    for (const write of activityWrites) {
        batch.set(db.collection('activities').doc(write.id), write.data);
    }
    for (const write of completionWrites) {
        batch.set(db.collection('activity-completion').doc(write.id), write.data);
    }
    await batch.commit();

    console.log(`\nListo: ${activityWrites.length} actividades y ${completionWrites.length} completions escritas.`);
}

main().catch(error => {
    console.error('\nError:', error.message);
    process.exitCode = 1;
});
