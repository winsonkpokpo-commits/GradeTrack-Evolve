create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_role public.role_utilisateur;
begin
    begin
        v_role := (new.raw_user_meta_data ->> 'role')::public.role_utilisateur;
    exception when invalid_text_representation then
        v_role := 'eleve';
    end;
    if v_role is null then
        v_role := 'eleve';
    end if;

    insert into public.utilisateur (id, email, nom, prenom, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'nom', ''),
        coalesce(new.raw_user_meta_data ->> 'prenom', ''),
        v_role
    );

    if v_role = 'eleve' then
        insert into public.eleve (utilisateur_id)
        values (new.id);
    end if;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();