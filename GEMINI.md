# Mandats du Projet Salvia 🌿

Ce document définit les règles immuables pour le développement de l'annuaire Salvia.

## 1. Principes Fondamentaux
- **Sobriété Numérique :** Limiter le poids des pages. Pas de bibliothèques JS lourdes. Nettoyage automatique des médias inutilisés. Compression d'image agressive (< 50 Ko).
- **Accessibilité (RGAA) :** HTML sémantique strict, liens d'évitement, aria-labels sur tous les contrôles, aria-live pour les mises à jour dynamiques.
- **Performance :** Polices système uniquement. Pas d'appels vers des CDN tiers. Score Lighthouse > 95 sur tous les axes.
- **Identité Visuelle :** Palette "Papier Chaud" (#fdfcfb), logo 🌱, typographie aérée et contrastes élevés.

## 2. Stack Technique (Full-Stack Serverless)
- **Frontend :** Astro (Static Mode pour les ressources, Hybrid/SSR pour l'admin).
- **Hébergement :** Cloudflare Pages (Connecté au dépôt GitHub).
- **Style :** Tailwind CSS + DaisyUI (Thème unique : `garden` personnalisé).
- **Base de Données :** Supabase (PostgreSQL 🇫🇷 Paris).
  - Utilisation de `JSONB` (`metadata`) pour la flexibilité des types.
  - Filtrage via opérateurs SQL (`@>`) pour les tags.
- **Maintenance :** Script de nettoyage (`scripts/cleanup-images.mjs`) via GitHub Actions (hebdomadaire).
- **Images :** WebP compressé (client), redimensionnement serveur via `sharp` et rendu via `object-contain`.

## 3. Standards d'Ingénierie (Clean Code)
- **Deduplication :** Toute logique partagée (ex: client Supabase, helpers d'image) doit être centralisée dans `src/lib/`.
- **Zéro Déchet :** Supprimer systématiquement le code mort, les fichiers inutilisés et les dépendances obsolètes.
- **Automatisation du Déploiement :** Le site utilise des **Webhooks Supabase** connectés à Cloudflare Pages. Tout `INSERT`, `UPDATE` ou `DELETE` sur la table `resources` déclenche automatiquement un nouveau build pour garantir la fraîcheur des données statiques.
- **Formatage :** Code lisible, typé (TypeScript) et correctement indenté.
- **Documentation Vivante :** Mettre à jour `GEMINI.md` et `README.md` à CHAQUE changement structurel pour qu'ils reflètent fidèlement l'état actuel du code.

## 4. Structure des Données (Supabase)
Toute ressource doit être stockée dans la table `resources` avec :
- `title`, `description`, `link`, `category`, `language`, `image_url`.
- `metadata` (JSONB) : contient un tableau `tags` et des champs spécifiques au type.

## 5. Logique i18n & Recherche
- Interface traduite via `/[lang]/`.
- Contenu global : ressources triées par date avec badge de langue.
- Recherche en temps réel via composants interactifs (Vanilla JS + Pagefind).

## 6. Dépendances
- Ne jamais installer de bibliothèque sans vérifier son impact sur le poids final.
- Tailwind v3 est imposé pour la compatibilité avec DaisyUI v4.
- Prioriser les solutions natives (Vanilla JS) pour l'interactivité.
