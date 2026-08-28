/**
 * Types de base de données générés à partir du schéma GradeTrack-Evolve.
 *
 * Source de vérité : supabase/schema.dbml et supabase/migrations/0001_schema_initial.sql.
 * Consommé par les clients Supabase (lib/supabase/*) pour typer les requêtes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      utilisateur: {
        Row: {
          id: string;
          email: string;
          mot_de_passe_hash: string | null;
          nom: string;
          prenom: string;
          photo_url: string | null;
          role: Database["public"]["Enums"]["role_utilisateur"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string;
          mot_de_passe_hash?: string | null;
          nom?: string;
          prenom?: string;
          photo_url?: string | null;
          role?: Database["public"]["Enums"]["role_utilisateur"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          mot_de_passe_hash?: string | null;
          nom?: string;
          prenom?: string;
          photo_url?: string | null;
          role?: Database["public"]["Enums"]["role_utilisateur"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      etablissement: {
        Row: {
          id: string;
          nom: string;
          type_etablissement: string;
          adresse: string | null;
          ville: string;
          code_postal: string | null;
          pays: string;
          telephone: string | null;
          email_contact: string | null;
          admin_utilisateur_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom?: string;
          type_etablissement?: string;
          adresse?: string | null;
          ville?: string;
          code_postal?: string | null;
          pays?: string;
          telephone?: string | null;
          email_contact?: string | null;
          admin_utilisateur_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          type_etablissement?: string;
          adresse?: string | null;
          ville?: string;
          code_postal?: string | null;
          pays?: string;
          telephone?: string | null;
          email_contact?: string | null;
          admin_utilisateur_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matiere: {
        Row: {
          id: string;
          nom: string;
          code: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom?: string;
          code?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          code?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      classe: {
        Row: {
          id: string;
          etablissement_id: string;
          nom: string;
          niveau: string;
          annee_scolaire: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          etablissement_id?: string;
          nom?: string;
          niveau?: string;
          annee_scolaire?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          etablissement_id?: string;
          nom?: string;
          niveau?: string;
          annee_scolaire?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trimestre: {
        Row: {
          id: string;
          classe_id: string;
          nom: string;
          date_debut: string | null;
          date_fin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          classe_id?: string;
          nom?: string;
          date_debut?: string | null;
          date_fin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          classe_id?: string;
          nom?: string;
          date_debut?: string | null;
          date_fin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      professeur: {
        Row: {
          id: string;
          utilisateur_id: string;
          etablissement_id: string;
          matiere_id: string | null;
          specialite: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          utilisateur_id?: string;
          etablissement_id?: string;
          matiere_id?: string | null;
          specialite?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          utilisateur_id?: string;
          etablissement_id?: string;
          matiere_id?: string | null;
          specialite?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      eleve: {
        Row: {
          id: string;
          utilisateur_id: string;
          classe_id: string | null;
          date_naissance: string | null;
          niveau: string | null;
          annee_entree: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          utilisateur_id?: string;
          classe_id?: string | null;
          date_naissance?: string | null;
          niveau?: string | null;
          annee_entree?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          utilisateur_id?: string;
          classe_id?: string | null;
          date_naissance?: string | null;
          niveau?: string | null;
          annee_entree?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      liaison_eleve_etablissement: {
        Row: {
          id: string;
          eleve_id: string;
          etablissement_id: string;
          statut: string;
          date_debut: string;
          date_fin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eleve_id?: string;
          etablissement_id?: string;
          statut?: string;
          date_debut?: string;
          date_fin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          eleve_id?: string;
          etablissement_id?: string;
          statut?: string;
          date_debut?: string;
          date_fin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      parent: {
        Row: {
          id: string;
          utilisateur_id: string;
          eleve_id: string;
          lien: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          utilisateur_id?: string;
          eleve_id?: string;
          lien?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          utilisateur_id?: string;
          eleve_id?: string;
          lien?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      note: {
        Row: {
          id: string;
          eleve_id: string;
          matiere_id: string;
          trimestre_id: string | null;
          valeur: number;
          coefficient: number;
          date_evaluation: string;
          type_evaluation: string;
          commentaire: string | null;
          saisie_par_utilisateur_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eleve_id?: string;
          matiere_id?: string;
          trimestre_id?: string | null;
          valeur?: number;
          coefficient?: number;
          date_evaluation?: string;
          type_evaluation?: string;
          commentaire?: string | null;
          saisie_par_utilisateur_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          eleve_id?: string;
          matiere_id?: string;
          trimestre_id?: string | null;
          valeur?: number;
          coefficient?: number;
          date_evaluation?: string;
          type_evaluation?: string;
          commentaire?: string | null;
          saisie_par_utilisateur_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      maquette_pedagogique: {
        Row: {
          id: string;
          etablissement_id: string;
          classe_id: string | null;
          matiere_id: string | null;
          annee_scolaire: string | null;
          coefficient: number;
          objectifs: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          etablissement_id?: string;
          classe_id?: string | null;
          matiere_id?: string | null;
          annee_scolaire?: string | null;
          coefficient?: number;
          objectifs?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          etablissement_id?: string;
          classe_id?: string | null;
          matiere_id?: string | null;
          annee_scolaire?: string | null;
          coefficient?: number;
          objectifs?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_etude: {
        Row: {
          id: string;
          eleve_id: string;
          titre: string;
          type_periode: string;
          date_debut: string;
          date_fin: string | null;
          contenu: string | null;
          statut: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eleve_id?: string;
          titre?: string;
          type_periode?: string;
          date_debut?: string;
          date_fin?: string | null;
          contenu?: string | null;
          statut?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          eleve_id?: string;
          titre?: string;
          type_periode?: string;
          date_debut?: string;
          date_fin?: string | null;
          contenu?: string | null;
          statut?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ressource: {
        Row: {
          id: string;
          titre: string;
          url: string;
          categorie: string | null;
          description: string | null;
          matiere_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titre?: string;
          url?: string;
          categorie?: string | null;
          description?: string | null;
          matiere_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          titre?: string;
          url?: string;
          categorie?: string | null;
          description?: string | null;
          matiere_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommandation_ia: {
        Row: {
          id: string;
          eleve_id: string;
          plan_etude_id: string | null;
          type: string;
          titre: string | null;
          contenu: string;
          priorite: string;
          statut: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eleve_id?: string;
          plan_etude_id?: string | null;
          type?: string;
          titre?: string | null;
          contenu?: string;
          priorite?: string;
          statut?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          eleve_id?: string;
          plan_etude_id?: string | null;
          type?: string;
          titre?: string | null;
          contenu?: string;
          priorite?: string;
          statut?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      emploi_du_temps: {
        Row: {
          id: string;
          eleve_id: string | null;
          classe_id: string | null;
          matiere_id: string | null;
          jour_semaine: number;
          heure_debut: string;
          heure_fin: string;
          salle: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eleve_id?: string | null;
          classe_id?: string | null;
          matiere_id?: string | null;
          jour_semaine?: number;
          heure_debut?: string;
          heure_fin?: string;
          salle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          eleve_id?: string | null;
          classe_id?: string | null;
          matiere_id?: string | null;
          jour_semaine?: number;
          heure_debut?: string;
          heure_fin?: string;
          salle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification: {
        Row: {
          id: string;
          utilisateur_id: string;
          titre: string | null;
          message: string;
          type: string;
          lue: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          utilisateur_id?: string;
          titre?: string | null;
          message?: string;
          type?: string;
          lue?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          utilisateur_id?: string;
          titre?: string | null;
          message?: string;
          type?: string;
          lue?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      role_utilisateur:
        | "eleve"
        | "professeur"
        | "parent"
        | "admin_etablissement"
        | "admin_systeme";
    };
  };
};