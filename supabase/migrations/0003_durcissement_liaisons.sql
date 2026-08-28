-- Ferme une faille : un compte parent/professeur pouvait se lier lui-même
-- à un eleve_id / etablissement_id arbitraire (auto-affectation). Ces
-- policies redeviennent "fail closed" (admin_systeme / personnel gestionnaire
-- uniquement) en attendant les flux d'invitation propres (Phase 7.2 / 8.1).

drop policy if exists "parent_insert" on public.parent;
create policy "parent_insert" on public.parent for insert to authenticated
    with check (public.is_admin_systeme());

drop policy if exists "parent_update" on public.parent;
create policy "parent_update" on public.parent for update to authenticated
    using (public.is_admin_systeme())
    with check (public.is_admin_systeme());

drop policy if exists "professeur_insert" on public.professeur;
create policy "professeur_insert" on public.professeur for insert to authenticated
    with check (
        public.can_manage_establishment(etablissement_id)
        or public.is_admin_systeme()
    );

drop policy if exists "professeur_update" on public.professeur;
create policy "professeur_update" on public.professeur for update to authenticated
    using (
        public.can_manage_establishment(etablissement_id)
        or public.is_admin_systeme()
    )
    with check (
        public.can_manage_establishment(etablissement_id)
        or public.is_admin_systeme()
    );