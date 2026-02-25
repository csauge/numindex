# Mandats du Projet Salvia 🌿

Ce document définit les règles immuables pour le développement de l'annuaire Salvia.

## 1. Principes Fondamentaux
- **Sobriété Numérique :** Limiter le poids des pages. Pas de bibliothèques JS lourdes.
- **Accessibilité :** HTML sémantique strict et respect des contrastes (thème 'garden').
- **Performance :** Polices système uniquement. Pas d'appels vers des CDN tiers (Google Fonts, etc.).

## 2. Stack Technique
- **Framework :** Astro (Static Mode).
- **Style :** Tailwind CSS + DaisyUI (Thème unique : `garden`).
- **Données :** Astro Content Collections.
- **Recherche :** Pagefind (Indexation statique post-build).

## 3. Structure des Données (Strict)
Toute ressource doit être un fichier `.md` dans `src/content/ressources/{fr|en}/` avec le frontmatter suivant :
- `title`: string
- `description`: string
- `link`: url
- `category`: 'société' | 'association' | 'article' | 'podcast'
- `language`: 'fr' | 'en'
- `date`: YYYY-MM-DD

## 4. Logique i18n
- L'interface (UI) est traduite via les routes `/[lang]/`.
- Le contenu est **global** : les ressources de toutes les langues sont affichées ensemble, triées par date, avec un badge de langue.

## 5. Dépendances
- Ne jamais installer de bibliothèque sans vérifier son impact sur le poids final.
- Tailwind v3 est imposé pour la compatibilité avec DaisyUI v4.
- Utiliser Pagefind pour la recherche côté client sans base de données.
