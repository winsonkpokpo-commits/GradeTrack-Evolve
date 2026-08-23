import { redirect } from "next/navigation";

/**
 * Page racine.
 *
 * En principe le middleware redirige déjà « / » :
 *  - non connecté -> /login
 *  - connecté     -> la page d'accueil de son rôle
 * Ce redirect est un filet de sécurité au cas où / : ne serait pas intercepté.
 */
export default function Home() {
  redirect("/login");
}