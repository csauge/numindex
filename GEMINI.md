# Mandats du Projet Salvia 🌿

Ce document définit les règles immuables pour le développement de l'annuaire Salvia.

## 1. Principes Fondamentaux
- **Sobriété Numérique :** Limiter le poids des pages. Pas de bibliothèques JS lourdes.
- **Accessibilité (RGAA) :** HTML sémantique strict, liens d'évitement, aria-labels sur tous les contrôles, aria-live pour les mises à jour dynamiques.
- **Performance :** Polices système uniquement. Pas d'appels vers des CDN tiers.
- **Identité Visuelle :** Palette "Papier Chaud" (#fdfcfb), logo 🌱, typographie aérée et contrastes élevés.

## 2. Stack Technique (Full-Stack Serverless)
- **Frontend :** Astro (Static Mode pour les pages ressources, Hybrid/SSR pour le dynamisme).
- **Style :** Tailwind CSS + DaisyUI (Thème unique : `garden` personnalisé).
- **Base de Données :** Supabase (Hébergé en France ou à minima Europe).
  - Utilisation de `JSONB` (`metadata`) pour la flexibilité des types de ressources.
  - Filtrage via opérateurs SQL (`@>`) pour les tags.
- **Backend & Modération :** Cloudflare Workers.
  - Système de contribution via table `suggestions`.
  - Validation admin avant transfert vers table `resources`.
- **Images :** WebP (client) et AVIF (serveur via Astro Assets).

## 3. Structure des Données (Supabase)
Toute ressource doit être stockée dans la table `resources` avec :
- `title`, `description`, `link`, `category`, `language`, `image_url`.
- `metadata` (JSONB) : contient un tableau `tags` et des champs spécifiques au type.

## 4. Logique i18n & Recherche
- Interface traduite via `/[lang]/`.
- Contenu global : ressources triées par date avec badge de langue.
- Recherche en temps réel via composants interactifs (îles).

## 5. Dépendances
- Ne jamais installer de bibliothèque sans vérifier son impact sur le poids final.
- Tailwind v3 est imposé pour la compatibilité avec DaisyUI v4.
- Prioriser les solutions natives (Vanilla JS) pour l'interactivité.
