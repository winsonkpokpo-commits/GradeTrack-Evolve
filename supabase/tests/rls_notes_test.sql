-- =============================================================================
-- GradeTrack-Evolve -- Test manuel de validation Row Level Security
-- -----------------------------------------------------------------------------
-- Objectif : prouver qu'un eleve A ne peut PAS lire les notes d'un eleve B.
--
-- Prérequis :
--   1. La migration `0001_schema_initial.sql` a ete executee (schema + RLS).
--   2. Executer ce script dans le SQL Editor Supabase, en tant que superuser
--      (role `postgres` / `supabase_admin`), pour preparer les donnees de test.
--
-- Deroule :
--   1) Insertion de : 2 eleves (A et B), 1 admin etablissement (C),
--      un etablissement, un lien B->etablissement, et 1 note pour B.
--   2) Empreinte de session : on « se presente » en eleve A via les claims JWT
--      (methode `set_config` fournie par l'environnement Supabase).
--   3) SELECT sur `public.note` -> ATTENDU 0 ligne (A ne doit pas voir la note B).
--   4) Contre-preuve : on se presente en admin C de l'etablissement lie a B
--      -> la note de B devient lisible (1 ligne).
--
-- Remarque impersonation :
--   Si `set_config('request.jwt.claims', ...)` n'est pas disponible, utiliser :
--       SET request.jwt.claims = '{...}' ; SET ROLE authenticated ;
--       -- requetes --
--       RESET ROLE ;
-- =============================================================================

-- ================= 1) Donnees de demonstration ==============================
DO $$
DECLARE
    uid_a uuid := 'aaaaaaaa-0000-0000-0000-00000000000a';
    uid_b uuid := 'bbbbbbbb-0000-0000-0000-00000000000b';
    uid_c uuid := 'cccccccc-0000-0000-0000-00000000000c';
    v_eleve_b  uuid;
    v_etab     uuid;
    v_matiere  uuid;
BEGIN
    -- Utilisateurs (profils)
    INSERT INTO public.utilisateur (id, email, nom, prenom, role)
        VALUES (uid_a, 'eleve.a@test.local',  'Alpha', 'A', 'eleve'),
               (uid_b, 'eleve.b@test.local',  'Beta',  'B', 'eleve'),
               (uid_c, 'admin.c@test.local',  'Gamma', 'C', 'admin_etablissement');

    -- Profils eleves (A et B)
    INSERT INTO public.eleve (id, utilisateur_id) VALUES (gen_random_uuid(), uid_a);
    INSERT INTO public.eleve (id, utilisateur_id) VALUES (gen_random_uuid(), uid_b);

    SELECT id INTO v_eleve_b FROM public.eleve WHERE utilisateur_id = uid_b;

    -- Etablissement dont C est l'administrateur
    INSERT INTO public.etablissement (id, nom, ville, admin_utilisateur_id)
        VALUES (gen_random_uuid(), 'Lycee Test', 'Paris', uid_c)
        RETURNING id INTO v_etab;

    -- Liaison active : l'eleve B est lie a cet etablissement
    INSERT INTO public.liaison_eleve_etablissement (eleve_id, etablissement_id, statut, date_debut)
        VALUES (v_eleve_b, v_etab, 'actif', current_date);

    -- Une matiere et une note pour l'eleve B
    INSERT INTO public.matiere (nom, code) VALUES ('Mathematiques', 'MATH')
        RETURNING id INTO v_matiere;
    INSERT INTO public.note (eleve_id, matiere_id, valeur, type_evaluation, commentaire)
        VALUES (v_eleve_b, v_matiere, 15.50, 'devoir', 'note privee de B');

    RAISE NOTICE 'Seed OK : eleves A/B, admin C, etablissement, lien B et note de B.';
END $$;

-- ============ 2) CONTROLE AVANT IMPERSONATION (postgres, superuser) =========
-- En tant que postgres (contournement RLS), on doit VOIR la note de B.
SELECT count(*) AS nb_notes_vues_par_postgres
FROM public.note;

-- ============ 3) IMPERSONATION EN ELEVE A ===================================
SELECT set_config('request.jwt.claims',
   '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated","app_metadata":{"role":"eleve"}}');

-- ============ 4) VERIFICATION CLE : A ne lit pas les notes de B =============
-- ATTENDU : 0 ligne. Meme en forçant le filtre, RLS renvoie vide.
SELECT count(*) AS nb_notes_visibles_par_eleve_a
FROM public.note;

SELECT n.id AS note_id, n.valeur
FROM public.note n;   -- ATTENDU : aucun enregistrement visible

-- ============ 5) CONTRE-PREUVE : un admin lie lit la note de B ==============
SELECT set_config('request.jwt.claims',
    '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated","app_metadata":{"role":"admin_etablissement"}}');

-- ATTENDU : 1 ligne (l'admin C de l'etablissement lie a B lit la note de B).
SELECT count(*) AS nb_notes_visibles_par_admin_c
FROM public.note;

-- =============================================================================
-- FIN DU SCRIPT DE TEST. Les donnees de test restent en base ; purger avec :
--   DELETE FROM public.note ;
--   DELETE FROM public.liaison_eleve_etablissement ;
--   DELETE FROM public.eleve ; DELETE FROM public.utilisateur ;
-- =============================================================================