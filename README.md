# 🌱 Salvia

**Salvia** est un annuaire open-source de ressources numériques responsables (sociétés, associations, articles, podcasts, outils, livres). Le projet est conçu pour être un modèle de **sobriété numérique** et d'**accessibilité**.

---

## ✨ Points Forts du Projet

- **Sobriété Éclatante :** Un site performant avec une palette visuelle "Papier Chaud" apaisante.
- **Accessibilité (RGAA Ready) :** Navigation clavier optimisée, liens d'évitement, support complet des lecteurs d'écran.
- **Architecture Full-Stack Serverless :** Performance du statique (Astro) alliée à la puissance du dynamique (Supabase).
- **Maintenance Automatisée :** Nettoyage hebdomadaire automatique des médias inutilisés pour une empreinte numérique minimale.

## 🛠 Stack Technique

- **Frontend :** [Astro](https://astro.build/) (Static & Hybrid)
- **Styling :** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Base de Données :** [Supabase](https://supabase.com/) (PostgreSQL + Storage)
- **Maintenance :** GitHub Actions + Node.js scripts

## 📖 Comment contribuer ?

Salvia est un projet communautaire. Vous pouvez proposer une ressource directement via l'interface :

1. Cliquez sur le bouton **Proposer** dans la barre de navigation.
2. Remplissez le formulaire (votre image sera automatiquement compressée).
3. Une fois validée par un modérateur, votre ressource apparaîtra sur l'accueil !

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

## 🧹 Maintenance

Pour nettoyer manuellement les images orphelines dans le stockage :
```bash
node scripts/cleanup-images.mjs
```
*(Nécessite la clé `SUPABASE_SERVICE_ROLE_KEY` dans votre `.env`)*

---

*Ce projet est sous licence [MIT](LICENSE). 🌱 Pour un numérique plus conscient.*
