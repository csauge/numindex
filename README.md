# 🌱 Salvia

**Salvia** est un annuaire open-source de ressources numériques responsables (sociétés, associations, articles, podcasts, outils, livres). Le projet est conçu pour être un modèle de **sobriété numérique** et d'**accessibilité**.

---

## ✨ Points Forts du Projet

- **Sobriété Éclatante :** Un site performant avec une palette visuelle "Papier Chaud" apaisante.
- **Accessibilité (RGAA Ready) :** Navigation clavier optimisée, liens d'évitement, support complet des lecteurs d'écran.
- **Architecture Statique & Réactive :** Performance du statique (Astro) avec mises à jour en temps réel via Webhooks Supabase.
- **Optimisation d'Image :** Compression agressive côté client (< 50Ko) et optimisation serveur via `sharp`.

## 🛠 Stack Technique

- **Frontend :** [Astro](https://astro.build/) (Static Mode)
- **Hébergement :** [Cloudflare Pages](https://pages.cloudflare.com/)
- **Styling :** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Base de Données :** [Supabase](https://supabase.com/) (PostgreSQL + Storage)
- **CI/CD :** GitHub Actions (Maintenance) + Webhooks Supabase (Auto-rebuild)

## 📖 Comment contribuer ?

Salvia est un projet communautaire. Vous pouvez proposer une ressource directement via l'interface :

1. Cliquez sur le bouton **Proposer** dans la barre de navigation.
2. Remplissez le formulaire (votre image sera automatiquement compressée à un format ultra-léger).
3. Une fois validée par un modérateur, le site se reconstruira automatiquement pour afficher votre ressource.

## 🏗 Installation Locale

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/csauge/salvia.git
   cd salvia
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configurez votre fichier `.env` (voir `.env.example`).
4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 🧹 Maintenance & Scripts

Plusieurs scripts sont disponibles pour maintenir une empreinte numérique minimale :

- **Nettoyage des images orphelines :**
  ```bash
  npm run cleanup-images
  ```
  *(Supprime les images dans Supabase qui ne sont plus liées à une ressource)*

- **Optimisation des images existantes :**
  ```bash
  npm run optimize-images
  ```
  *(Redimensionne et compresse toutes les images du bucket au format WebP)*

---

*Ce projet est sous licence [MIT](LICENSE). 🌱 Pour un numérique plus conscient.*
