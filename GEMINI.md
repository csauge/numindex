# Mandats numindex.org 🌿

Ce document définit les règles essentielles pour le développement de numindex.org.

## 1. Principes Clés (Sobriété & Performance)
- **Écoconception :** Poids page léger (<50 Ko pour images AVIF), miniatures adaptées, pas de JS lourd.
- **Accessibilité :** RGAA, HTML sémantique, aria-labels, focus clavier.
- **Performance :** Polices système, Lighthouse > 95.

## 2. Stack Technique
- **Frontend :** Astro (Hybride : Static/SSR). Les pages de contenu fixe sont statiques, tandis que l'accueil, les détails des ressources et l'admin utilisent le SSR pour une mise à jour instantanée des données sans rebuild. Hébergement Cloudflare Pages.
- **Style :** Tailwind CSS + DaisyUI. Thème `garden`.
- **Backend :** Supabase (PostgreSQL, JSONB).
- **Communication :** Brevo API.

## 3. Standards d'Ingénierie
- **Code :** Clean Code, modulaire, lisible, robuste (validation client), DRY. Supprimer le code mort.
- **Composants :** Max ~300 lignes, logique externalisée.

## 4. Structure des Données
- Table `resources` : `title`, `description`, `link`, `category`, `image_url`.
- `tags` (text[]) : Colonne dédiée pour les tags (obligatoire et optionnels).
- `metadata` (JSONB) : Utilisé pour des champs comme `address` (lieu précis), `published_at` (date de parution), `version_date` (date de mise à jour), `occurrences` (tableau d'objets pour l'événement : start, end, address). L'usage de ces champs est géré par la logique applicative.
- `related_ids` (UUID[]) : Liens vers d'autres ressources (ex: une entité éditrice d'une publication).

## 5. Livraison Finale (Checklist)
1.  **Qualité :** Nettoyer code (`console.log`, commentaires), factoriser logique métier.
2.  **Sobriété/Perf :** `npm run verify-sobriety`, vérifier RGAA.
3.  **Technique :** `npm run build`, `npm run test:e2e`.
4.  **Docs :** Mettre à jour `README.md`, `GEMINI.md`, `supabase_schema.sql`.
5.  **Git :** `git status`, `git diff`, commit normé.
