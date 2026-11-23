/**
 * Etiqueta los datos históricos de Firestore con el año lectivo 2026 y crea
 * las memberships iniciales. Idempotente: no sobrescribe campos existentes.
 *
 * Uso:
 *   node scripts/backfill-school-year.mjs           # dry-run
 *   node scripts/backfill-school-year.mjs --apply   # escribe
 */
import {cert, initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {readFileSync} from 'node:fs';

const YEAR = 2026;
const apply = process.argv.includes('--apply');
const sa = JSON.parse(readFileSync(new URL('../service-account.json', import.meta.url), 'utf8'));
initializeApp({credential: cert(sa), projectId: 'scout-app-7b912'});
const db = getFirestore();

const groups = await db.collection('groups').get();
if (groups.size !== 1) {
  throw new Error(`Se esperaba un único grupo, hay ${groups.size}. Revisá el proyecto.`);
}
const groupDoc = groups.docs[0];
const groupId = groupDoc.id;

const [users, sets, activities, completions, existingMemberships] = await Promise.all([
  db.collection('users').get(),
  db.collection('sets').get(),
  db.collection('activities').get(),
  db.collection('activity-completion').get(),
  db.collection('memberships').where('year', '==', YEAR).get()
]);

const membershipsByUser = new Set(existingMemberships.docs.map(d => d.data().user_id));
const plan = [];

const groupPatch = {};
if (groupDoc.data().active_year === undefined) plan.push(['groups/' + groupId, {active_year: YEAR}]);
if (!Array.isArray(groupDoc.data().years) || groupDoc.data().years.length === 0) {
  plan.push(['groups/' + groupId, {years: [YEAR]}]);
}

for (const doc of users.docs) {
  if (membershipsByUser.has(doc.id)) continue;
  const data = doc.data();
  plan.push(['memberships/<auto>', {
    user_id: doc.id,
    group_id: data.group_id ?? groupId,
    year: YEAR,
    type: data.type ?? 'Beneficiario',
    level: data.level ?? null,
    set_id: data.set_id ?? null,
    active: true,
    created_at: data.created_at ?? new Date()
  }]);
}

for (const [collection, snapshot] of [
  ['sets', sets],
  ['activities', activities],
  ['activity-completion', completions]
]) {
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const field = collection === 'sets' ? 'active' : 'year';
    const value = collection === 'sets' ? true : YEAR;
    if (data[field] === undefined) {
      plan.push([`${collection}/${doc.id}`, {[field]: value}]);
    }
  }
}

console.log(`Proyecto: scout-app-7b912 | Grupo: ${groupDoc.data().name} (${groupId})`);
console.log(`Usuarios: ${users.size} | Secciones: ${sets.size} | Actividades: ${activities.size} | Completaciones: ${completions.size}`);
console.log(`Memberships ${YEAR} existentes: ${existingMemberships.size}`);
console.log(`\n${plan.length} escrituras planeadas (primeras 8):`);
for (const [ref, data] of plan.slice(0, 8)) console.log(' ', ref, JSON.stringify(data));

if (!apply) {
  console.log('\nDry-run: no se escribió nada. Pasá --apply para aplicar.');
  process.exit(0);
}

for (let i = 0; i < plan.length; i += 400) {
  const batch = db.batch();
  for (const [ref, data] of plan.slice(i, i + 400)) {
    if (ref === 'memberships/<auto>') batch.set(db.collection('memberships').doc(), data);
    else batch.update(db.doc(ref), data);
  }
  await batch.commit();
}

console.log(`\nListo: ${plan.length} escrituras aplicadas.`);
