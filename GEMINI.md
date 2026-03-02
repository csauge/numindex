# Mandats du Projet Salvia 🌿

Ce document définit les règles immuables pour le développement de l'annuaire Salvia.

## 1. Principes Fondamentaux (Écoconception)
- **Sobriété Numérique :** Limiter le poids des pages. Pas de bibliothèques JS lourdes.
- **Sobriété des Médias :** Utilisation systématique du format **AVIF** via les transformations Supabase. Compression agressive client-side (< 50 Ko).
- **Sobriété Réseau :** Utiliser des miniatures (thumbnails) adaptées au contexte d'affichage (ex: 400px pour la grille).
- **Sobriété CPU :** Utiliser des fonctions `debounce` pour les recherches en temps réel afin d'économiser la batterie mobile.
- **Accessibilité (RGAA) :** HTML sémantique strict, liens d'évitement, aria-labels, et gestion propre du focus clavier.
- **Performance :** Polices système uniquement. Score Lighthouse > 95 sur tous les axes.

## 2. Stack Technique (Astro 5 Hybrid)
- **Frontend :** Astro en mode **Static** par défaut, avec pages de détails et admin en **SSR** (`export const prerender = false`) pour une mise à jour instantanée des données.
- **Hébergement :** Cloudflare Pages (Adaptateur Cloudflare avec `imageService: 'compile'`).
- **Style :** Tailwind CSS 3 + DaisyUI 4 (Thème unique : `garden` personnalisé).
- **Base de Données :** Supabase (PostgreSQL).
  - Utilisation de `JSONB` (`metadata`) pour les données flexibles (ville, dates spécifiques).
  - Trigger SQL pour la gestion automatique de `updated_at`.

## 3. Standards d'Ingénierie (Clean Code & Maintainability)
- **Deduplication & Modularité :** Extraire la logique métier complexe du DOM (ex: `src/lib/services.ts`).
- **Lisibilité :** Privilégier les objets de mapping pour manipuler le DOM (`elements = { ... }`) plutôt que des sélections éparpillées.
- **Taille de code :** Maîtriser et réduire la quantité de code. Un composant ne doit pas dépasser ~300 lignes si sa logique peut être externalisée.
- **Robustesse :** Validation des données côté client avant envoi. Gestion des états d'erreur et de chargement (Toasts, feedback visuel).
- **Zéro Déchet :** Supprimer systématiquement le code mort et les scripts orphelins (ex: anciens scripts de migration Markdown).

## 4. Structure des Données
Toute ressource est stockée dans la table `resources` avec :
- `title`, `description`, `link`, `category`, `language`, `image_url`.
- `metadata` (JSONB) : `city`, `published_at`, etc.
- `related_ids` (UUID[]) : Liens vers d'autres ressources (ex: une entité éditrice d'un article).

## 5. Logique i18n
- Interface bilingue via `/[lang]/`.
- Contenu global : ressources triées par date de création avec badge de langue.
- Recherche multi-critères : Texte, Catégorie, Langue.
---
