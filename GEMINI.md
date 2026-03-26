# Mandats du Projet numindex.org 🌿

Ce document définit les règles immuables pour le développement de l'index numindex.org.

## 1. Principes Fondamentaux (Écoconception)
- **Sobriété Numérique :** Limiter le poids des pages. Pas de bibliothèques JS lourdes.
- **Sobriété des Médias :** Utilisation systématique du format **AVIF** via les transformations Supabase. Compression agressive client-side (< 50 Ko).
- **Sobriété Réseau :** Utiliser des miniatures (thumbnails) adaptées au contexte d'affichage (ex: 400px pour la grille).
- **Sobriété CPU :** Utiliser des fonctions `debounce` pour les recherches en temps réel afin d'économiser la batterie mobile.
- **Accessibilité (RGAA) :** HTML sémantique strict, liens d'évitement, aria-labels, et gestion propre du focus clavier.
- **Performance :** Polices système uniquement. Score Lighthouse > 95 sur tous les axes.

## 2. Stack Technique (Astro 5 Hybrid)
- **Frontend :** Astro en mode **Hybride**.
  - Pages de contenu fixe (A propos, etc.) : **Static**.
  - Accueil, détails des ressources et admin : **SSR** (`export const prerender = false`) pour une mise à jour instantanée des données sans rebuild.
- **Hébergement :** Cloudflare Pages (Adaptateur Cloudflare avec `imageService: 'compile'`).
- **Style :** Tailwind CSS 3 + DaisyUI 4 (Thème unique : `garden` personnalisé).
- **Base de Données :** Supabase (PostgreSQL).
  - Utilisation de `JSONB` (`metadata`) pour les données flexibles (ville, dates spécifiques).
  - Trigger SQL pour la gestion automatique de `updated_at`.
- **Communications :** Brevo API pour l'envoi des messages via le formulaire de contact (`/api/contact`).

## 3. Standards d'Ingénierie (Clean Code & Maintainability)
- **Deduplication & Modularité :** Extraire la logique métier complexe du DOM (ex: `src/lib/services.ts`).
- **Lisibilité :** Privilégier les objets de mapping pour manipuler le DOM (`elements = { ... }`) plutôt que des sélections éparpillées.
- **Taille de code :** Maîtriser et réduire la quantité de code. Un composant ne doit pas dépasser ~300 lignes si sa logique peut être externalisée.
- **Robustesse :** Validation des données côté client avant envoi. Gestion des états d'erreur et de chargement (Toasts, feedback visuel).
- **Zéro Déchet :** Supprimer systématiquement le code mort et les scripts orphelins (ex: anciens scripts de migration Markdown).

## 4. Structure des Données
Toute ressource est stockée dans la table `resources` avec :
- `title`, `description`, `link`, `category` (**acteur, evenement, contenu, outil**), `image_url`.
- `tags` (text[]) : Contient le tag obligatoire (sous-catégorie) et les tags optionnels.
- `metadata` (JSONB) : `address` (lieu précis), `published_at` (date de parution), `version_date` (date de mise à jour), `occurrences` (tableau d'objets pour les événements : start, end, address).
- `related_ids` (UUID[]) : Liens vers d'autres ressources (ex: une entité éditrice d'une publication).

## 5. Checklist de Livraison Finale (Commande "Checklist")
Avant toute livraison (Push), le développeur ou l'agent doit impérativement valider ces étapes :

1.  **Audit Qualitatif (Clean Code) :**
    - Supprimer les `console.log`, commentaires inutiles, code mort ou orphelin.
    - Vérifier la factorisation de la logique métier (extraction dans `services.ts`).
2.  **Audit Sobriété & Performance :**
    - Lancer `npm run verify-sobriety` (Images AVIF < 50 Ko).
    - Vérifier l'accessibilité RGAA (ARIA, sémantique HTML).
3.  **Validation Technique :**
    - Lancer `npm run build` pour vérifier les types et les imports.
    - Lancer `npm run test:e2e` (Playwright) sur l'instance locale (`.env.test`).
4.  **Mise à jour Documentation & Schéma :**
    - Mettre à jour `README.md` (nouvelles fonctionnalités, commandes, tests).
    - Mettre à jour `GEMINI.md` (nouveaux mandats, checklist, stack).
    - Mettre à jour `supabase_schema.sql` si le schéma SQL a changé.
5.  **Revue Git :**
    - Faire un `git status` et `git diff` pour une dernière revue humaine.
    - Proposer un message de commit normé.
