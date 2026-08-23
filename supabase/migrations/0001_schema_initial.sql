-- =============================================================================
-- GradeTrack-Evolve — Phase 1 : Cadrage (schéma de données)
-- Migration PostgreSQL / Supabase — Version initiale
-- -----------------------------------------------------------------------------
-- Entités couvertes :
--   Utilisateur, Etablissement, Eleve, LiaisonEleveEtablissement,
--   Classe, Matiere, Note, Trimestre, MaquettePedagogique, PlanEtude,
--   Ressource, RecommandationIA, EmploiDuTemps, Notification,
--   Professeur, Parent.
--
-- Sécurité (Row Level Security) :
--   Un élève ne lit que ses propres données.
--   S'il est lié à un établissement, les rôles `professeur` et
--   `admin_etablissement` de CET établissement accèdent en lecture à ses
--   données académiques (notes / classes). Ils ne peuvent JAMAIS écrire
--   directement sur les données personnelles d'un élève (hors notes/classes).
--   Les politiques s'appuient sur la claim JWT `app_metadata.role` (Supabase
--   Auth), avec repli sur la colonne `utilisateur.role`.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enum : rôles utilisateur
-- -----------------------------------------------------------------------------
do $$
begin
    create type public.role_utilisateur as enum (
        'eleve',
        'professeur',
        'parent',
        'admin_etablissement',
        'admin_systeme'
    );
exception
    when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Table : utilisateur (profil lié à auth.users)
-- -----------------------------------------------------------------------------
create table public.utilisateur (
    id                  uuid primary key default gen_random_uuid(),
    email               text not null unique,
    mot_de_passe_hash   text,
    nom                 text not null,
    prenom              text not null,
    photo_url           text,
    role                public.role_utilisateur not null,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
comment on table public.utilisateur is
    'Profil applicatif. `id` correspond à l''identifiant Supabase Auth (auth.users.id).';

-- -----------------------------------------------------------------------------
-- Table : etablissement
-- -----------------------------------------------------------------------------
create table public.etablissement (
    id                      uuid primary key default gen_random_uuid(),
    nom                     text not null,
    type_etablissement      text not null default 'college',
    adresse                 text,
    ville                   text not null,
    code_postal             text,
    pays                    text not null default 'France',
    telephone               text,
    email_contact           text,
    admin_utilisateur_id    uuid references public.utilisateur (id),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);
comment on table public.etablissement is
    'Établissement scolaire (primaire, collège, lycée, université).';
-- -----------------------------------------------------------------------------
-- Table : matiere (référentiel global de matières)
-- -----------------------------------------------------------------------------
create table public.matiere (
    id            uuid primary key default gen_random_uuid(),
    nom           text not null,
    code          text unique,
    description   text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
comment on table public.matiere is
    'Référentiel de matières (mathématiques, français, langues, etc.).';

-- -----------------------------------------------------------------------------
-- Table : classe (appartient à un établissement)
-- -----------------------------------------------------------------------------
create table public.classe (
    id                  uuid primary key default gen_random_uuid(),
    etablissement_id    uuid not null references public.etablissement (id),
    nom                 text not null,
    niveau              text not null,
    annee_scolaire      text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
comment on table public.classe is 'Classe d''un établissement pour une année scolaire donnée.';

-- -----------------------------------------------------------------------------
-- Table : trimestre (période d''évaluation rattachée à une classe)
-- -----------------------------------------------------------------------------
create table public.trimestre (
    id            uuid primary key default gen_random_uuid(),
    classe_id     uuid not null references public.classe (id),
    nom           text not null,
    date_debut    date,
    date_fin      date,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    constraint trimestre_dates_coherentes check (
        date_fin is null or date_debut is null or date_debut <= date_fin
    )
);
comment on table public.trimestre is 'Période d''évaluation (trimestre/semestre) d''une classe.';

-- -----------------------------------------------------------------------------
-- Table : professeur (profil enseignant rattaché à un établissement)
-- -----------------------------------------------------------------------------
create table public.professeur (
    id                  uuid primary key default gen_random_uuid(),
    utilisateur_id      uuid not null references public.utilisateur (id),
    etablissement_id    uuid not null references public.etablissement (id),
    matiere_id          uuid references public.matiere (id),
    specialite          text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    constraint professeur_un_utilisateur unique (utilisateur_id)
);
comment on table public.professeur is
    'Profil enseignant : un utilisateur de rôle `professeur`, membre d''un établissement.';

-- -----------------------------------------------------------------------------
-- Table : eleve (profil élève)
-- -----------------------------------------------------------------------------
create table public.eleve (
    id                uuid primary key default gen_random_uuid(),
    utilisateur_id    uuid not null references public.utilisateur (id),
    classe_id         uuid references public.classe (id),
    date_naissance    date,
    niveau            text,
    annee_entree      integer,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    constraint eleve_un_utilisateur unique (utilisateur_id)
);
comment on table public.eleve is
    'Profil élève. `classe_id` peut être NULL (élève autonome non lié à une classe).';
-- -----------------------------------------------------------------------------
-- Table : liaison_eleve_etablissement (lien élève ↔ établissement)
-- -----------------------------------------------------------------------------
create table public.liaison_eleve_etablissement (
    id                  uuid primary key default gen_random_uuid(),
    eleve_id            uuid not null references public.eleve (id),
    etablissement_id    uuid not null references public.etablissement (id),
    statut              text not null default 'actif',
    date_debut          date not null default current_date,
    date_fin            date,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    constraint liaison_eleve_etab_unique unique (eleve_id, etablissement_id),
    constraint liaison_statut_valide check (
        statut in ('actif', 'inactif', 'ancien')
    )
);
comment on table public.liaison_eleve_etablissement is
    'Liaison réelle élève ↔ établissement. C''est ce lien qui ouvre, en lecture, '
    'les notes/classes d''un élève aux professeurs et admins de l''établissement.';

-- -----------------------------------------------------------------------------
-- Table : parent (profil parent / tuteur d''un élève)
-- -----------------------------------------------------------------------------
create table public.parent (
    id                uuid primary key default gen_random_uuid(),
    utilisateur_id    uuid not null references public.utilisateur (id),
    eleve_id          uuid not null references public.eleve (id),
    lien              text,                          -- pere, mere, tuteur, ...
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    constraint parent_valeur_lien check (lien is null or lien in ('pere', 'mere', 'tuteur', 'autre')),
    constraint parent_unique_lien unique (utilisateur_id, eleve_id)
);
comment on table public.parent is
    'Profil parent : relie un utilisateur de rôle `parent` à un élève.';

-- -----------------------------------------------------------------------------
-- Table : note (résultat d''une évaluation d''un élève)
-- -----------------------------------------------------------------------------
create table public.note (
    id                        uuid primary key default gen_random_uuid(),
    eleve_id                  uuid not null references public.eleve (id),
    matiere_id                uuid not null references public.matiere (id),
    trimestre_id              uuid references public.trimestre (id),
    valeur                    numeric(5, 2) not null,
    coefficient               numeric(3, 2) not null default 1,
    date_evaluation           date not null default current_date,
    type_evaluation           text not null default 'devoir',
    commentaire               text,
    saisie_par_utilisateur_id uuid references public.utilisateur (id),
    created_at                timestamptz not null default now(),
    updated_at                timestamptz not null default now(),
    constraint note_valeur_dans_echelle check (valeur >= 0 and valeur <= 20),
    constraint note_coefficient_positif check (coefficient > 0),
    constraint note_type_valide check (
        type_evaluation in ('devoir', 'controle', 'examen', 'tp', 'oral', 'autre')
    )
);
comment on table public.note is
    'Note d''un élève dans une matière. L''école saisit, l''élève lié la consulte.';
-- -----------------------------------------------------------------------------
-- Table : maquette_pedagogique (coefficients / objectifs pédagogiques)
-- -----------------------------------------------------------------------------
create table public.maquette_pedagogique (
    id                uuid primary key default gen_random_uuid(),
    etablissement_id  uuid not null references public.etablissement (id),
    classe_id         uuid references public.classe (id),
    matiere_id        uuid references public.matiere (id),
    annee_scolaire    text,
    coefficient       numeric(3, 2) not null default 1 check (coefficient > 0),
    objectifs         text,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);
comment on table public.maquette_pedagogique is
    'Maquette pédagogique : coefficients et objectifs par classe/matière.';

-- -----------------------------------------------------------------------------
-- Table : plan_etude (plan d''étude personnalisé d''un élève)
-- -----------------------------------------------------------------------------
create table public.plan_etude (
    id               uuid primary key default gen_random_uuid(),
    eleve_id         uuid not null references public.eleve (id),
    titre            text not null,
    type_periode     text not null check (
        type_periode in ('journalier', 'hebdomadaire', 'mensuel', 'semestriel', 'personnalise')
    ),
    date_debut       date not null,
    date_fin         date,
    contenu          text,
    statut           text not null default 'actif' check (
        statut in ('actif', 'termine', 'archive')
    ),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
comment on table public.plan_etude is
    'Plan d\''étude (généré IA ou manuel) propre à un élève. Donnée personnelle.';

-- -----------------------------------------------------------------------------
-- Table : ressource (ressource pédagogique / extrascolaire)
-- -----------------------------------------------------------------------------
create table public.ressource (
    id               uuid primary key default gen_random_uuid(),
    titre            text not null,
    url              text not null,
    categorie        text,
    description      text,
    matiere_id       uuid references public.matiere (id),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
comment on table public.ressource is
    'Ressource pédagogique (programmation, ML, langues...) proposée aux élèves.';

-- -----------------------------------------------------------------------------
-- Table : recommandation_ia (recommandation / rappel généré)
-- -----------------------------------------------------------------------------
create table public.recommandation_ia (
    id               uuid primary key default gen_random_uuid(),
    eleve_id         uuid not null references public.eleve (id),
    plan_etude_id    uuid references public.plan_etude (id),
    type             text not null check (
        type in ('rappel', 'conseil', 'ressource', 'alerte')
    ),
    titre            text,
    contenu          text not null,
    priorite         text not null default 'normale' check (
        priorite in ('basse', 'normale', 'haute')
    ),
    statut           text not null default 'non_lue' check (
        statut in ('non_lue', 'lue', 'archivee')
    ),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
comment on table public.recommandation_ia is
    'Recommandation / rappel généré, propre à un élève. Donnée personnelle.';

-- -----------------------------------------------------------------------------
-- Table : emploi_du_temps (créneau horaire)
-- -----------------------------------------------------------------------------
create table public.emploi_du_temps (
    id               uuid primary key default gen_random_uuid(),
    eleve_id         uuid references public.eleve (id),
    classe_id        uuid references public.classe (id),
    matiere_id       uuid references public.matiere (id),
    jour_semaine     smallint not null check (jour_semaine between 1 and 7),
    heure_debut      time not null,
    heure_fin        time not null,
    salle            text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    constraint edt_horaire_coherent check (heure_debut < heure_fin),
    constraint edt_un_proprietaire check (eleve_id is not null or classe_id is not null)
);
comment on table public.emploi_du_temps is
    'Créneau d''emploi du temps (rattaché à une classe ou à un élève).';

-- -----------------------------------------------------------------------------
-- Table : notification (destinée à un utilisateur)
-- -----------------------------------------------------------------------------
create table public.notification (
    id               uuid primary key default gen_random_uuid(),
    utilisateur_id   uuid not null references public.utilisateur (id),
    titre            text,
    message          text not null,
    type             text not null default 'info' check (
        type in ('info', 'alerte', 'rappel', 'succes')
    ),
    lue              boolean not null default false,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
comment on table public.notification is 'Notification destinée à un utilisateur précis.';
-- -----------------------------------------------------------------------------
-- Trigger : mise à jour automatique de `updated_at`
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

do $$
declare r record;
begin
    for r in (
        select '"' || table_schema || '"."' || table_name || '"'::text as tbl
        from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
    ) loop
        begin
            execute format('create trigger trg_updated_at before update on %s for each row execute function public.set_updated_at()', r.tbl);
        exception when others then null;
        end;
    end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Index : clés étrangères (performances + intégrité de requêtes RLS)
-- -----------------------------------------------------------------------------
create index if not exists idx_etablissement_admin on public.etablissement (admin_utilisateur_id);
create index if not exists idx_classe_etablissement on public.classe (etablissement_id);
create index if not exists idx_trimestre_classe on public.trimestre (classe_id);
create index if not exists idx_prof_utilisateur on public.professeur (utilisateur_id);
create index if not exists idx_prof_etablissement on public.professeur (etablissement_id);
create index if not exists idx_eleve_classe on public.eleve (classe_id);
create index if not exists idx_eleve_utilisateur on public.eleve (utilisateur_id);
create index if not exists idx_liaison_eleve on public.liaison_eleve_etablissement (eleve_id);
create index if not exists idx_liaison_etab on public.liaison_eleve_etablissement (etablissement_id);
create index if not exists idx_parent_utilisateur on public.parent (utilisateur_id);
create index if not exists idx_parent_eleve on public.parent (eleve_id);
create index if not exists idx_note_eleve on public.note (eleve_id);
create index if not exists idx_note_matiere on public.note (matiere_id);
create index if not exists idx_note_trimestre on public.note (trimestre_id);
create index if not exists idx_maquette_etab on public.maquette_pedagogique (etablissement_id);
create index if not exists idx_maquette_classe on public.maquette_pedagogique (classe_id);
create index if not exists idx_plan_eleve on public.plan_etude (eleve_id);
create index if not exists idx_rec_eleve on public.recommandation_ia (eleve_id);
create index if not exists idx_edt_classe on public.emploi_du_temps (classe_id);
create index if not exists idx_edt_eleve on public.emploi_du_temps (eleve_id);
create index if not exists idx_notif_utilisateur on public.notification (utilisateur_id);
-- =============================================================================
-- FONCTIONS HELPER POUR LES POLICIES RLS
-- -----------------------------------------------------------------------------
-- Toutes ces fonctions sont `security definer` : elles s'exécutent avec les
-- droits du propriétaire (postgres/supabase_admin) et ne sont donc PAS bloquées
-- par la RLS des tables qu'elles interrogent. Elles sont ainsi sûres à appeler
-- depuis une politique de sécurité.
-- =============================================================================

-- Récupère le rôle de l'utilisateur courant (claim JWT `app_metadata.role`,
-- avec repli sur la colonne `utilisateur.role` si la claim est absente).
create or replace function public.current_user_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_role text;
begin
    v_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
    if v_role = '' then
        select role::text into v_role
        from public.utilisateur
        where id = auth.uid();
    end if;
    return coalesce(v_role, '');
end;
$$;

-- Renvoie l'identifiant du profil élève de l'utilisateur courant (ou NULL).
create or replace function public.current_eleve_id()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_eleve_id uuid;
begin
    select id into v_eleve_id
    from public.eleve
    where utilisateur_id = auth.uid();
    return v_eleve_id;
end;
$$;

-- Renvoie l'ensemble des établissements dont l'utilisateur courant est
-- professeur ou admin_etablissement.
create or replace function public.current_staff_etablissement_ids()
returns setof uuid
language sql
security definer
set search_path = ''
as $$
    select id from public.etablissement where admin_utilisateur_id = auth.uid()
    union
    select etablissement_id from public.professeur where utilisateur_id = auth.uid()
$$;

-- Vrai si l'utilisateur courant est admin système.
create or replace function public.is_admin_systeme()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    return public.current_user_role() = 'admin_systeme';
end;
$$;

-- Vrai si l'utilisateur courant est professeur ou admin d'un établissement.
create or replace function public.is_staff_or_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    return public.current_user_role() in ('professeur', 'admin_etablissement');
end;
$$;

-- Vrai si l'élève `p_eleve_id` est lié (de manière active) à un établissement
-- dont l'utilisateur courant est professeur ou admin_etablissement.
create or replace function public.current_user_is_staff_of_student(p_eleve_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.current_user_role() not in ('professeur', 'admin_etablissement') then
        return false;
    end if;
    return exists (
        select 1
        from public.liaison_eleve_etablissement lee
        where lee.eleve_id = p_eleve_id
          and lee.etablissement_id in (select * from public.current_staff_etablissement_ids())
          and (lee.date_fin is null or lee.date_fin >= current_date)
    );
end;
$$;

-- Vrai si l'utilisateur courant est parent d'un élève.
create or replace function public.is_parent_of_student(p_eleve_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    return public.current_user_role() = 'parent'
        and exists (
            select 1 from public.parent
            where utilisateur_id = auth.uid() and eleve_id = p_eleve_id
        );
end;
$$;

-- Accès LECTURE aux données d'un élève donné :
--   - pour l'élève lui-même,
--   - pour un parent de l'élève,
--   - pour un professeur / admin_etablissement d'un établissement auquel
--     l'élève est lié,
--   - pour un admin système.
create or replace function public.can_read_student_data(p_eleve_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.current_eleve_id() = p_eleve_id then
        return true;
    end if;
    if public.is_admin_systeme() then
        return true;
    end if;
    if public.is_parent_of_student(p_eleve_id) then
        return true;
    end if;
    return public.current_user_is_staff_of_student(p_eleve_id);
end;
$$;

-- Accès ÉCRITURE aux résultats académiques (notes) d'un élève :
-- l'élève lui-même (autonome) ou le personnel de l'établissement lié,
-- ou un admin système.
create or replace function public.can_write_student_grades(p_eleve_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.is_admin_systeme() then
        return true;
    end if;
    if public.current_eleve_id() = p_eleve_id then
        return true;
    end if;
    return public.current_user_is_staff_of_student(p_eleve_id);
end;
$$;

-- Accès LECTURE aux données « scolaires » d'une classe (planning, maquette...).
create or replace function public.can_read_establishment(p_etab_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.is_admin_systeme() then return true; end if;
    -- élève lié à cet établissement
    if public.current_user_role() = 'eleve'
        and exists (
            select 1 from public.liaison_eleve_etablissement lee
            where lee.eleve_id = public.current_eleve_id()
              and lee.etablissement_id = p_etab_id
              and (lee.date_fin is null or lee.date_fin >= current_date)
        ) then return true; end if;
    -- personnel de cet établissement
    if public.current_user_role() in ('professeur', 'admin_etablissement')
        and (p_etab_id in (select * from public.current_staff_etablissement_ids())) then return true; end if;
    return false;
end;
$$;
-- Vrai si l'utilisateur courant peut GÉRER un établissement (admin système ou
-- professeur/admin_etablissement de cet établissement).
create or replace function public.can_manage_establishment(p_etab_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.is_admin_systeme() then return true; end if;
    if public.current_user_role() in ('professeur', 'admin_etablissement') then
        return p_etab_id in (select * from public.current_staff_etablissement_ids());
    end if;
    return false;
end;
$$;

-- Vrai si l'utilisateur courant est l'élève concerné (ou un admin système) :
-- accès écriture aux DONNÉES PERSONNELLES d'un élève (jamais pour un tiers).
create or replace function public.can_write_own_student_data(p_eleve_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    if public.is_admin_systeme() then return true; end if;
    return public.current_eleve_id() = p_eleve_id;
end;
$$;

-- =============================================================================
-- POLICIES ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
-- Principe :
--   * Un élève ne lit que ses propres données (données personnelles).
--   * Les professeurs / admin_etablissement lisent, pour les élèves liés à
--     leur établissement, les données académiques (notes, classes).
--   * Personne (hors l'élève lui-même) n'écrit directement les données
--     personnelles ; l'école écrit uniquement sur les notes et les classes.
-- =============================================================================

alter table public.utilisateur enable row level security;
alter table public.etablissement enable row level security;
alter table public.matiere enable row level security;
alter table public.classe enable row level security;
alter table public.trimestre enable row level security;
alter table public.professeur enable row level security;
alter table public.eleve enable row level security;
alter table public.liaison_eleve_etablissement enable row level security;
alter table public.parent enable row level security;
alter table public.note enable row level security;
alter table public.maquette_pedagogique enable row level security;
alter table public.plan_etude enable row level security;
alter table public.ressource enable row level security;
alter table public.recommandation_ia enable row level security;
alter table public.emploi_du_temps enable row level security;
alter table public.notification enable row level security;

-- ===================== utilisateur (donnée personnelle) =====================
create policy "utilisateur_select" on public.utilisateur for select to authenticated
    using (id = auth.uid() or public.is_admin_systeme());
create policy "utilisateur_insert" on public.utilisateur for insert to authenticated
    with check (id = auth.uid() or public.is_admin_systeme());
create policy "utilisateur_update" on public.utilisateur for update to authenticated
    using (id = auth.uid() or public.is_admin_systeme())
    with check (id = auth.uid() or public.is_admin_systeme());
create policy "utilisateur_delete" on public.utilisateur for delete to authenticated
    using (id = auth.uid() or public.is_admin_systeme());

-- ===================== etablissement ========================================
create policy "etablissement_select" on public.etablissement for select to authenticated
    using (public.can_read_establishment(id));
create policy "etablissement_insert" on public.etablissement for insert to authenticated
    with check (public.is_admin_systeme());
create policy "etablissement_update" on public.etablissement for update to authenticated
    using (public.is_admin_systeme())
    with check (public.is_admin_systeme());
create policy "etablissement_delete" on public.etablissement for delete to authenticated
    using (public.is_admin_systeme());

-- ===================== matiere (référentiel public) =========================
create policy "matiere_select" on public.matiere for select to public using (true);
create policy "matiere_write" on public.matiere for all to authenticated
    using (public.is_admin_systeme())
    with check (public.is_admin_systeme());
-- ===================== classe (géré par l'établissement) ====================
create policy "classe_select" on public.classe for select to authenticated
    using (public.can_read_establishment(etablissement_id));
create policy "classe_insert" on public.classe for insert to authenticated
    with check (public.can_manage_establishment(etablissement_id));
create policy "classe_update" on public.classe for update to authenticated
    using (public.can_manage_establishment(etablissement_id))
    with check (public.can_manage_establishment(etablissement_id));
create policy "classe_delete" on public.classe for delete to authenticated
    using (public.can_manage_establishment(etablissement_id));

-- ===================== trimestre (rattaché à une classe) ====================
create policy "trimestre_select" on public.trimestre for select to authenticated
    using (
        exists (
            select 1 from public.classe c
            where c.id = trimestre.classe_id
              and public.can_read_establishment(c.etablissement_id)
        )
    );
create policy "trimestre_insert" on public.trimestre for insert to authenticated
    with check (
        exists (
            select 1 from public.classe c
            where c.id = trimestre.classe_id
              and public.can_manage_establishment(c.etablissement_id)
        )
    );
create policy "trimestre_update" on public.trimestre for update to authenticated
    using (
        exists (
            select 1 from public.classe c
            where c.id = trimestre.classe_id
              and public.can_manage_establishment(c.etablissement_id)
        )
    )
    with check (
        exists (
            select 1 from public.classe c
            where c.id = trimestre.classe_id
              and public.can_manage_establishment(c.etablissement_id)
        )
    );
create policy "trimestre_delete" on public.trimestre for delete to authenticated
    using (
        exists (
            select 1 from public.classe c
            where c.id = trimestre.classe_id
              and public.can_manage_establishment(c.etablissement_id)
        )
    );
-- ===================== professeur (profil / membre établissement) ============
create policy "professeur_select" on public.professeur for select to authenticated
    using (
        utilisateur_id = auth.uid()
        or public.can_read_establishment(etablissement_id)
    );
create policy "professeur_insert" on public.professeur for insert to authenticated
    with check (
        utilisateur_id = auth.uid()
        or public.can_manage_establishment(etablissement_id)
    );
create policy "professeur_update" on public.professeur for update to authenticated
    using (
        utilisateur_id = auth.uid()
        or public.can_manage_establishment(etablissement_id)
    )
    with check (
        utilisateur_id = auth.uid()
        or public.can_manage_establishment(etablissement_id)
    );
create policy "professeur_delete" on public.professeur for delete to authenticated
    using (
        utilisateur_id = auth.uid()
        or public.can_manage_establishment(etablissement_id)
    );

-- ===================== eleve (donnée personnelle) ===========================
-- L'élève écrit SES données. Le personnel de l'établissement lié accède en
-- LECTURE ; il n'écrit JAMAIS directement sur ce profil personnel.
create policy "eleve_select" on public.eleve for select to authenticated
    using (public.can_read_student_data(id));
create policy "eleve_insert" on public.eleve for insert to authenticated
    with check (public.can_write_own_student_data(id));
create policy "eleve_update" on public.eleve for update to authenticated
    using (public.can_write_own_student_data(id))
    with check (public.can_write_own_student_data(id));
create policy "eleve_delete" on public.eleve for delete to authenticated
    using (public.can_write_own_student_data(id));

-- ============ liaison_eleve_etablissement (créée par l'école) ===============
create policy "liaison_select" on public.liaison_eleve_etablissement for select to authenticated
    using (
        public.can_read_student_data(eleve_id)
        or exists (
            select 1 from public.classe c
            where c.id = (select classe_id from public.eleve e where e.id = eleve_id)
              and public.can_read_establishment(c.etablissement_id)
        )
    );
create policy "liaison_insert" on public.liaison_eleve_etablissement for insert to authenticated
    with check (
        public.can_manage_establishment(etablissement_id)
        or public.is_admin_systeme()
    );
create policy "liaison_update" on public.liaison_eleve_etablissement for update to authenticated
    using (
        public.can_read_student_data(eleve_id)
        or public.can_manage_establishment(etablissement_id)
    )
    with check (
        public.can_read_student_data(eleve_id)
        or public.can_manage_establishment(etablissement_id)
    );
create policy "liaison_delete" on public.liaison_eleve_etablissement for delete to authenticated
    using (
        public.can_manage_establishment(etablissement_id)
        or public.is_admin_systeme()
        or public.current_eleve_id() = eleve_id
    );
-- ===================== parent (profil parent) ===============================
create policy "parent_select" on public.parent for select to authenticated
    using (utilisateur_id = auth.uid() or public.is_admin_systeme());
create policy "parent_insert" on public.parent for insert to authenticated
    with check (utilisateur_id = auth.uid() or public.is_admin_systeme());
create policy "parent_update" on public.parent for update to authenticated
    using (utilisateur_id = auth.uid() or public.is_admin_systeme())
    with check (utilisateur_id = auth.uid() or public.is_admin_systeme());
create policy "parent_delete" on public.parent for delete to authenticated
    using (utilisateur_id = auth.uid() or public.is_admin_systeme());

-- ===================== note (résultat académique) ===========================
-- L'école (professeur / admin du bon établissement) SAISIT et met à jour les
-- notes d'un élève qui lui est lié ; l'élève autonome gère aussi ses propres
-- notes. Un élève ne lit QUE ses propres notes (garantie par can_read_student_data).
create policy "note_select" on public.note for select to authenticated
    using (public.can_read_student_data(eleve_id));
create policy "note_insert" on public.note for insert to authenticated
    with check (public.can_write_student_grades(eleve_id));
create policy "note_update" on public.note for update to authenticated
    using (public.can_write_student_grades(eleve_id))
    with check (public.can_write_student_grades(eleve_id));
create policy "note_delete" on public.note for delete to authenticated
    using (public.can_write_student_grades(eleve_id));
-- ===================== maquette_pedagogique =================================
create policy "maquette_select" on public.maquette_pedagogique for select to authenticated
    using (public.can_read_establishment(etablissement_id));
create policy "maquette_insert" on public.maquette_pedagogique for insert to authenticated
    with check (public.can_manage_establishment(etablissement_id));
create policy "maquette_update" on public.maquette_pedagogique for update to authenticated
    using (public.can_manage_establishment(etablissement_id))
    with check (public.can_manage_establishment(etablissement_id));
create policy "maquette_delete" on public.maquette_pedagogique for delete to authenticated
    using (public.can_manage_establishment(etablissement_id));

-- ===================== plan_etude (donnée personnelle élève) ================
create policy "plan_etude_select" on public.plan_etude for select to authenticated
    using (public.can_read_student_data(eleve_id));
create policy "plan_etude_insert" on public.plan_etude for insert to authenticated
    with check (public.can_write_own_student_data(eleve_id));
create policy "plan_etude_update" on public.plan_etude for update to authenticated
    using (public.can_write_own_student_data(eleve_id))
    with check (public.can_write_own_student_data(eleve_id));
create policy "plan_etude_delete" on public.plan_etude for delete to authenticated
    using (public.can_write_own_student_data(eleve_id));

-- ===================== ressource (catalogue public) =========================
create policy "ressource_select" on public.ressource for select to public using (true);
create policy "ressource_write" on public.ressource for all to authenticated
    using (public.is_admin_systeme())
    with check (public.is_admin_systeme());

-- ===================== recommandation_ia (donnée personnelle) ===============
-- Lecture pour l'élève (+ personnel lié / parent / admin). L'écriture est
-- réservée au service IA (admin système / service role).
create policy "recommandation_select" on public.recommandation_ia for select to authenticated
    using (public.can_read_student_data(eleve_id));
create policy "recommandation_insert" on public.recommandation_ia for insert to authenticated
    with check (public.is_admin_systeme());
create policy "recommandation_update" on public.recommandation_ia for update to authenticated
    using (public.is_admin_systeme())
    with check (public.is_admin_systeme());
create policy "recommandation_delete" on public.recommandation_ia for delete to authenticated
    using (public.is_admin_systeme());

-- ===================== emploi_du_temps ======================================
create policy "edt_select" on public.emploi_du_temps for select to authenticated
    using (
        (eleve_id is not null and public.can_read_student_data(eleve_id))
        or (
            classe_id is not null
            and exists (
                select 1 from public.classe c
                where c.id = classe_id
                  and public.can_read_establishment(c.etablissement_id)
            )
        )
    );
create policy "edt_insert" on public.emploi_du_temps for insert to authenticated
    with check (
        (eleve_id is not null and public.can_write_own_student_data(eleve_id))
        or (
            classe_id is not null
            and exists (
                select 1 from public.classe c
                where c.id = classe_id
                  and public.can_manage_establishment(c.etablissement_id)
            )
        )
    );
create policy "edt_update" on public.emploi_du_temps for update to authenticated
    using (
        (eleve_id is not null and public.can_write_own_student_data(eleve_id))
        or (
            classe_id is not null
            and exists (
                select 1 from public.classe c
                where c.id = classe_id
                  and public.can_manage_establishment(c.etablissement_id)
            )
        )
    )
    with check (
        (eleve_id is not null and public.can_write_own_student_data(eleve_id))
        or (
            classe_id is not null
            and exists (
                select 1 from public.classe c
                where c.id = classe_id
                  and public.can_manage_establishment(c.etablissement_id)
            )
        )
    );
create policy "edt_delete" on public.emploi_du_temps for delete to authenticated
    using (
        (eleve_id is not null and public.can_write_own_student_data(eleve_id))
        or (
            classe_id is not null
            and exists (
                select 1 from public.classe c
                where c.id = classe_id
                  and public.can_manage_establishment(c.etablissement_id)
            )
        )
    );

-- ===================== notification =========================================
create policy "notification_select" on public.notification for select to authenticated
    using (utilisateur_id = auth.uid() or public.is_admin_systeme());
create policy "notification_insert" on public.notification for insert to authenticated
    with check (utilisateur_id = auth.uid() or public.is_admin_systeme());
create policy "notification_update" on public.notification for update to authenticated
    using (utilisateur_id = auth.uid() or public.is_admin_systeme())
    with check (utilisateur_id = auth.uid() or public.is_admin_systeme());
create policy "notification_delete" on public.notification for delete to authenticated
    using (utilisateur_id = auth.uid() or public.is_admin_systeme());

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================