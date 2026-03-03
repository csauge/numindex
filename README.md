# 🌱 Salvia

**Salvia** est un annuaire open-source de ressources numériques responsables (sociétés, associations, articles, podcasts, outils, livres). Le projet est conçu pour être un modèle de **sobriété numérique** et d'**accessibilité**, aligné sur les principes du **RGESN** et du **GR491**.

## ✨ Caractéristiques

- **Architecture Hybride (Astro 5) :** Mixte Statique (performance) et SSR (données temps-réel pour l'admin et les détails).
- **Sobriété Maximale :** Images au format **AVIF** avec miniatures redimensionnées via Supabase.
- **Relations Dynamiques :** Liens entre "Acteurs" (entités) et "Contenus" (ressources).
- **Localisation :** Intégration de l'API **Photon (OSM)** pour une saisie de ville simplifiée.
- **Internationalisation :** Entièrement bilingue (Français 🇫🇷 / Anglais 🇬🇧).
- **Zéro Dépendance Lourde :** Utilisation de Vanilla JS pour l'interactivité.

## 🛠 Stack Technique

- **Frontend :** [Astro](https://astro.build/) (Hybrid mode).
- **Style :** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/).
- **Base de Données :** [Supabase](https://supabase.com/) (PostgreSQL).
- **Hébergement :** [Cloudflare Pages](https://pages.cloudflare.com/).

## 🚀 Installation & Développement

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/votre-compte/salvia.git
    cd salvia
    ```
2.  **Installer les dépendances :**
    ```bash
    npm install
    ```
3.  **Configurer l'environnement :**
    Copiez `.env.example` vers `.env` et remplissez vos clés Supabase.
    ```bash
    cp .env.example .env
    ```
4.  **Lancer le serveur de dev :**
    ```bash
    npm run dev
    ```

## 🏗 Structure de la Base de Données

Le schéma est disponible dans `supabase_schema.sql`. Il inclut un trigger automatique pour la gestion de `updated_at` et une colonne `metadata` JSONB pour la flexibilité (ville, date de parution, etc.).

## 🧹 Maintenance

- **Nettoyage automatique :** Un script hebdomadaire supprime les images orphelines.
- **Optimisation des images existantes :**
  ```bash
  npm run optimize-images
  ```

## 🧪 Tests

Le projet utilise **Playwright** pour assurer la qualité et la non-régression de l'annuaire et du workflow de modération.

- **Exécuter tous les tests :**
  ```bash
  npm run test:e2e
  ```
- **Tests couverts :**
  - Navigation et redirection de langue.
  - Recherche et filtrage dynamique.
  - Cycle de vie complet des ressources (Proposition -> Modération -> Publication -> Suppression).

---

*Ce projet est sous licence [MIT](LICENSE). 🌱 Pour un numérique plus conscient.*
