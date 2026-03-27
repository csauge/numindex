# 🌱 numindex.org

**numindex.org** est un index open-source de ressources numériques responsables (sociétés, associations, publications, podcasts, outils, livres, index). Le projet est conçu pour être un modèle de **sobriété numérique** et d'**accessibilité**, aligné sur les principes du **RGESN** et du **GR491**.

## ✨ Caractéristiques

- **Architecture Hybride (Astro 5) :** Mixte Statique (performance) et SSR (données temps-réel pour l'admin et les détails).
- **Filtrage & Tri Avancé :** Recherche temps-réel, filtrage par 4 grandes catégories (**Acteur, Événement, Contenu, Outil**) et tri dynamique.
- **Système de Tags Structuré :** Chaque ressource possède une sous-catégorie obligatoire et des tags qualificatifs optionnels (ex: ESS, Open Source, Débutant).
- **Favoris :** Possibilité pour les utilisateurs connectés de sauvegarder leurs ressources préférées avec synchronisation en temps réel et compteur global.
- **Export de Données :** Possibilité d'exporter les ressources filtrées au format **CSV**.
- **Flux Calendrier (ICS) :** Abonnement aux événements via un lien `.ics` gérant désormais les multi-occurrences (dates multiples pour un même événement).
- **Bascule d'affichage :** Mode **Grille** visuel ou **Liste ultra-compacte** (type tableau) avec mémorisation de la préférence.
- **Sobriété Maximale :** Images au format **AVIF** avec miniatures redimensionnées via Supabase.
- **Relations Dynamiques :** Liens entre "Acteur" (entité) et "Contenu" (ressource).
- **Métadonnées Contextuelles :** Gestion des adresses (via API Photon OSM), dates de parution, versions et occurrences multiples pour les événements.
- **Internationalisation :** Entièrement bilingue (Français 🇫🇷 / Anglais 🇬🇧).
- **Zéro Dépendance Lourde :** Utilisation de Vanilla JS pour l'interactivité.

## 🛠 Fonctionnalités Admin & Modération

- **Dashboard SSR** : Liste des suggestions en temps réel avec indicateur de badge.
- **Workflow de Correction** : Le modérateur peut corriger une proposition (ajout ou modification) avant de l'approuver définitivement.
- **Visualisation des Différences** : Les champs modifiés par rapport à la ressource originale sont mis en évidence par un contour rouge.
- **Tags & Catégories** : Interface de sélection intelligente des tags en fonction de la catégorie choisie.
- **Approbation Directe** : Validation en un clic qui applique les changements en base de données.

## 🛠 Stack Technique

- **Frontend :** [Astro](https://astro.build/) (Hybrid mode).
- **Style :** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/).
- **Base de Données :** [Supabase](https://supabase.com/) (PostgreSQL).
- **Communications :** [Brevo API](https://www.brevo.com/) pour le formulaire de contact.
- **Hébergement :** [Cloudflare Pages](https://pages.cloudflare.com/).

## 🚀 Installation & Développement

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/csauge/numindex.git
    cd numindex
    ```
2.  **Installer les dépendances :**
    ```bash
    npm install
    ```
3.  **Configurer l'environnement :**
    Copiez `.env.example` vers `.env` pour la production et créez un `.env.test` pour le local.
    ```bash
    cp .env.example .env
    ```

### 💻 Développement Local (Supabase CLI)

Le projet utilise le CLI Supabase pour un développement isolé et robuste.

1.  **Lancer Supabase (Docker requis) :**
    ```bash
    npx supabase start
    ```
2.  **Appliquer le schéma et les données de test :**
    ```bash
    npx supabase db reset
    ```
3.  **Lancer le serveur de dev :**
    ```bash
    npm run dev
    ```

Accédez au dashboard local (Studio) via : [http://127.0.0.1:54323](http://127.0.0.1:54323)

## 🏗 Structure de la Base de Données

Le schéma est disponible dans `supabase_schema.sql`. Il inclut un trigger automatique pour la gestion de `updated_at` et une colonne `metadata` JSONB pour la flexibilité (ville, date de parution, etc.).

## 🧹 Maintenance

- **Nettoyage automatique :** Un script hebdomadaire supprime les images orphelines.
- **Optimisation des images existantes :**
  ```bash
  npm run optimize-images
  ```

## 🧪 Tests

Le projet utilise **Vitest** pour les tests unitaires et **Playwright** pour assurer la qualité et la non-régression de l'index et du workflow de modération.

- **Exécuter les tests unitaires :**
  ```bash
  npm run test:unit
  ```
- **Exécuter les tests E2E :**
  ```bash
  npm run test:e2e
  ```
- **Tests couverts :**
  - Logique client des favoris (Mocks Supabase).
  - Navigation et redirection de langue.
  - Recherche et filtrage dynamique.
  - Cycle de vie complet des ressources (Proposition -> Modération -> Publication -> Suppression).
  - Système de favoris (UI et Persistance).
  - Métadonnées (Villes et Dates).
  - Formulaire de Contact (Mock API).

---

*Ce projet est sous licence [MIT](LICENSE). 🌱 Pour un numérique plus conscient.*
