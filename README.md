# 🌱 numindex.org

**numindex.org** est un index open-source de ressources numériques responsables (sociétés, associations, publications, podcasts, outils, livres, index). Le projet est conçu pour être un modèle de **sobriété numérique** et d'**accessibilité**, aligné sur les principes du **RGESN** et du **GR491**.

## ✨ Caractéristiques

- **Architecture Hybride (Astro) :** Mixte Statique (performance) et SSR (données temps-réel pour l'admin et les détails).
- **Filtrage & Tri Avancé :** Recherche temps-réel, filtrage par 4 grandes catégories (**Acteur, Événement, Contenu, Outil**) et tri dynamique.
- **Système de Tags Structuré :** Chaque ressource possède une sous-catégorie obligatoire et des tags qualificatifs optionnels (ex: ESS, Open Source, Débutant).
- **Favoris :** Synchronisation en temps réel et compteur global pour les utilisateurs connectés.
- **Export de Données :** Export des ressources filtrées au format **HTML (Favoris Navigateur)** pour une importation facile.
- **Flux Calendrier (ICS) :** Abonnement aux événements avec gestion des occurrences multiples.
- **Sobriété Maximale :** Images au format **AVIF** avec miniatures optimisées.
- **Relations Dynamiques :** Liens entre entités (Acteurs) et ressources (Contenus).
- **Internationalisation :** Entièrement bilingue (Français 🇫🇷 / Anglais 🇬🇧).

## 🛠 Fonctionnalités Admin & Modération

- **Administration des utilisateurs** : Consultation de la liste des inscrits (noms, emails, rôles) via une API sécurisée.
- **Dashboard SSR** : Liste des suggestions en temps réel avec indicateur de badge.
- **Workflow de Correction** : Correction des propositions avant approbation.
- **Visualisation des Différences** : Mise en évidence des champs modifiés.
- **Tags & Catégories** : Interface de sélection intelligente des tags.

## 🛠 Stack Technique

- **Frontend :** [Astro](https://astro.build/) (Hybrid mode).
- **Style :** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/).
- **Base de Données :** [Supabase](https://supabase.com/) (PostgreSQL).
- **Images :** [Sharp](https://sharp.pixelplumbing.com/) pour la conversion AVIF ultra-légère.
- **Communications :** [Brevo API](https://www.brevo.com/) pour le formulaire de contact.
- **Hébergement :** [Cloudflare Pages](https://pages.cloudflare.com/).

## 🧹 Maintenance & Sobriété

Le projet inclut une maintenance automatisée via **GitHub Actions** (`maintenance.yml`) qui s'exécute chaque dimanche :
- **Optimisation AVIF :** Convertit et redimensionne les nouvelles images en AVIF (600px, qualité 50).
- **Nettoyage :** Supprime les images orphelines du bucket Supabase qui ne sont plus liées à une ressource.

### Scripts utiles

- `npm run verify-sobriety` : Audit local des images statiques (limite 20 Ko).
- `npm run optimize-images` : Migration manuelle des images vers AVIF.
- `npm run cleanup-images` : Suppression manuelle des images orphelines.

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
    Copiez `.env.example` vers `.env`.
    ```bash
    cp .env.example .env
    ```

### 💻 Développement Local (Supabase CLI)

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

## 🧪 Tests

- **Tests unitaires :** `npm run test:unit`
- **Tests E2E :** `npm run test:e2e`

---

*Ce projet est sous licence [MIT](LICENSE). 🌱 Pour un numérique plus conscient.*
