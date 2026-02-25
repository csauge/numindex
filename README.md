# 🌱 Salvia

**Salvia** est un annuaire open-source de ressources numériques responsables (sociétés, associations, articles, podcasts). Le projet est conçu pour être un modèle de **sobriété numérique** et d'**accessibilité**.

---

## ✨ Points Forts du Projet

- **Sobriété Éclatante :** Un site statique performant avec une palette visuelle "Papier Chaud" apaisante.
- **Accessibilité (RGAA Ready) :** Navigation clavier optimisée, liens d'évitement, support complet des lecteurs d'écran (aria-labels, aria-live).
- **Filtrage Intelligent :** Recherche textuelle et filtres (catégorie, langue) instantanés en Vanilla JS, sans appel serveur.
- **i18n Hybride :** Interface multilingue mais contenu global (accès à toutes les ressources quelle que soit la langue sélectionnée).

## 🛠 Stack Technique

- **Framework :** [Astro](https://astro.build/) (Static Mode)
- **Styling :** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Données :** Astro Content Collections (Markdown locaux)
- **Interactivité :** Vanilla JS (0 dépendance externe pour la recherche)

## 📖 Comment contribuer ?

Salvia est un projet communautaire. Vous pouvez proposer une ressource via le bouton dédié (bientôt disponible) ou en créant une Pull Request :

1. Créez un fichier `.md` dans `src/content/ressources/fr/` ou `src/content/ressources/en/`.
2. Suivez le schéma strict défini dans `src/content/config.ts`.
3. Soumettez votre PR !

## 🏗 Installation Locale

```bash
git clone https://github.com/votre-compte/salvia.git
cd salvia
npm install
npm run dev
```

---

*Ce projet est sous licence [MIT](LICENSE). 🌱 Pour un numérique plus conscient.*
