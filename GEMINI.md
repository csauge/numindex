# Mandats numindex.org 🌿

Ce document définit les règles essentielles et les standards d'ingénierie pour le développement de numindex.org.

## 1. Principes de Conception (Sobriété & Performance)
- **Écoconception :** Poids page léger, images AVIF (<20 Ko pour les vignettes), miniatures adaptées, pas de JS lourd (Vanilla JS privilégié), score EcoIndex ≥ C obligatoire.
- **Souveraineté des données :** Localisation des données et du stockage en UE/Paris (Supabase Paris). Choix de prestataires indépendants et éco-responsables pour le domaine (Infomaniak). Configuration Cloudflare sans stockage persistant (Smart Routing).
- **Maintenance Automatisée :** Nettoyage des images orphelines et ré-optimisation AVIF hebdomadaire via GitHub Actions.
- **SEO :** Méta-données dynamiques (Open Graph, Twitter), balises `hreflang` pour l'i18n, URLs canoniques et sitemap automatiques.
- **Accessibilité :** Conformité RGAA, HTML sémantique, aria-labels explicites, navigation au clavier.
- **Performance :** Polices système uniquement, score Lighthouse ≥ 85 obligatoire.

## 2. Standards d'Ingénierie
- **Tests :** Privilégier les tests unitaires (Vitest) qui sont plus rapides à exécuter pour valider la logique métier. Réserver les tests E2E (Playwright) à la validation des parcours utilisateurs critiques et de l'intégration globale.
- **Code :** Clean Code, modulaire, lisible, typage strict (TypeScript). Supprimer systématiquement le code mort.
- **Composants :** Taille maximale ~300 lignes. La logique complexe doit être externalisée dans `src/lib`.
- **SSR vs Static :** Utiliser le SSR pour les données dynamiques (Admin, Détails ressource, Catégories) et le statique pour le contenu fixe (About, Guide, Terms).

## 3. Structure des Données (Supabase)
- **Table `resources` :** `title`, `description`, `link`, `category`, `image_url`, `tags` (text[]), `related_ids` (UUID[]).
- **`metadata` (JSONB) :** Colonne flexible pour les attributs contextuels :
    - `address` : String (Lieu ou adresse précise).
    - `published_at` : Date ISO (Date de parution pour les publications ou dernier épisode de podcast).
    - `version_date` : Date ISO (Date de mise à jour pour les outils).
    - `rss_url` : String (URL du flux RSS pour les podcasts).
    - `last_episode_title` : String (Titre du dernier épisode récupéré via RSS).
    - `occurrences` : Array d'objets `{ start, end, address }` (Dates multiples pour les événements).
    - `online` : Boolean (Indicateur de ressource en ligne/distanciel).
- **Triggers :** Gestion automatique de `updated_at` et des compteurs de favoris.

## 4. Checklist de Livraison Finale
1.  **Qualité :** Nettoyage du code (`console.log`, commentaires inutiles), factorisation.
2.  **Sobriété/Perf :** Exécution de `npm run verify-sobriety`, vérification RGAA.
3.  **Validation :** `npm run build`, `npm run test:unit`, `npm run test:e2e`.
4.  **Documentation :** Mettre à jour `README.md`, `GEMINI.md` et le schéma SQL (`supabase_schema.sql`) si nécessaire.
5.  **Git (Flux de travail PR) :** **INTERDICTION ABSOLUE** de pousser des modifications directement sur la branche `main`. Toute livraison doit suivre le processus suivant (toujours avec l'accord préalable de l'utilisateur) :
    - Créer une nouvelle branche (ex: `feature/nom-de-la-fonctionnalite` ou `fix/correction-bug`).
    - Commiter les changements et pousser la branche sur le dépôt distant.
    - Créer une Pull Request pointant vers `main` (via l'interface GitHub ou la CLI `gh pr create`).
    - *Bonne pratique :* Une fois la Pull Request mergée, la branche de travail doit être supprimée pour garder le dépôt propre.
