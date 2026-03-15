import { getUnsyncedReports, markAsSynced } from './db';
import { supabase } from './supabase';

/**
 * Service pour synchroniser les données d'IndexedDB vers Supabase (Cloud)
 * Idéalement appelé lors du retour de la connexion (événement 'online') ou via un Service Worker.
 */
export const syncReportsToCloud = async () => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    console.log('Mode hors ligne ou SSR. Synchronisation reportée.');
    return;
  }

  try {
    const unsyncedReports = await getUnsyncedReports();
    
    if (unsyncedReports.length === 0) {
      console.log('Aucun signalement à synchroniser.');
      return;
    }

    console.log(`Tentative de synchronisation de ${unsyncedReports.length} signalements...`);

    // Récupère l'utilisateur actuellement connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('Utilisateur non connecté. Impossible de synchroniser les signalements sur le Cloud.');
      return;
    }

    // ENSURE PROFILE EXISTS (Self-healing mechanism)
    // We use upsert to simplify and avoid race conditions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Chauffeur',
        // We only set initial values if it's a new profile
        // Note: score/level might be overwritten if not careful, 
        // but here we just want to ensure it exists.
      }, { onConflict: 'id', ignoreDuplicates: true }) // Ignore if already exists
      .select('score, reports_count, level')
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification/création du profil:', profileError);
    }

    // Préparation du lot de données pour Supabase
    const reportsToInsert = unsyncedReports.map(report => ({
      id: report.id,
      user_id: user.id,
      type: report.type,
      latitude: report.latitude,
      longitude: report.longitude,
      timestamp: new Date(report.timestamp).toISOString(),
      reporter_name: report.reporterName,
      reporter_level: report.reporterLevel,
      upvotes: report.upvotes,
      downvotes: report.downvotes,
      custom_location: report.customLocation,
      location_name: report.locationName
    }));

    // Insertion en masse dans Supabase
    console.log('Envoi des rapports à Supabase:', reportsToInsert);
    const { error: insertError } = await supabase
      .from('reports')
      .insert(reportsToInsert);

    if (insertError) {
      console.error('Erreur insertion Supabase:', insertError);
      if (insertError.code === '23505') {
        console.warn('Certains signalements existent déjà côté serveur.');
        for (const report of unsyncedReports) {
          await markAsSynced(report.id);
        }
      } else if (insertError.code === 'PGRST204') {
        console.error('CRITICAL: Colonne custom_location manquante sur Supabase. Exécutez le script SQL fourni.');
        throw new Error('Database schema out of sync');
      } else {
        throw insertError;
      }
    } else {
      console.log('Synchronisation réussie !');
      for (const report of unsyncedReports) {
        await markAsSynced(report.id);
      }
      
      // Update Cloud Profile Stats
      const currentProfile = profile || { score: 100, reports_count: 0, level: 'Novice' };
      const newScore = currentProfile.score + (unsyncedReports.length * 10);
      let newLevel = currentProfile.level;
      if (newScore > 500) newLevel = 'Veteran';
      else if (newScore > 200) newLevel = 'Scout';

      console.log('Mise à jour du profil Cloud...', { newScore, newLevel });
      const { error: updateError } = await supabase.from('profiles').update({ 
        score: newScore, 
        reports_count: (currentProfile.reports_count || 0) + unsyncedReports.length,
        level: newLevel
      }).eq('id', user.id);
      
      if (updateError) console.error('Erreur mise à jour profil:', updateError);
    }
  } catch (err) {
    console.error('Erreur CRITIQUE lors de la synchronisation vers le cloud:', err);
  }
};

// Auto-activer la synchronisation dès que le navigateur revient en ligne
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connexion internet rétablie. Lancement de la synchronisation...');
    syncReportsToCloud();
  });
}
