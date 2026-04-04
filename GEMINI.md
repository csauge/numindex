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
    - `published_at` : Date ISO (Date de parution pour les publications).
    - `version_date` : Date ISO (Date de mise à jour pour les outils).
    - `occurrences` : Array d'objets `{ start, end, address }` (Dates multiples pour les événements).
    - `online` : Boolean (Indicateur de ressource en ligne/distanciel).
- **Triggers :** Gestion automatique de `updated_at` et des compteurs de favoris.

## 4. Checklist de Livraison Finale
1.  **Qualité :** Nettoyage du code (`console.log`, commentaires inutiles), factorisation.
2.  **Sobriété/Perf :** Exécution de `npm run verify-sobriety`, vérification RGAA.
3.  **Validation :** `npm run build`, `npm run test:unit`, `npm run test:e2e`.
4.  **Documentation :** Mettre à jour `README.md`, `GEMINI.md` et le schéma SQL (`supabase_schema.sql`) si nécessaire.
5.  **Git :** **INTERDICTION ABSOLUE** de commit ou push sans l'accord explicite et préalable de l'utilisateur. La procédure obligatoire est de demander l'autorisation avant toute action Git destructive ou d'envoi.
