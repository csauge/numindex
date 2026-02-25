# 🌿 Salvia

**Salvia** est un annuaire open-source de ressources numériques responsables (sociétés, associations, articles, podcasts). Le projet est conçu pour être un exemple de **sobriété numérique** et d'**accessibilité**.

---

## 🚀 Philosophie du projet

Salvia repose sur trois piliers :
- **Sobriété :** Un site statique ultra-léger, sans JavaScript inutile.
- **Accessibilité :** Une interface inclusive respectant les standards sémantiques.
- **Collaboration :** Un système d'ajout automatisé via des formulaires externes (Tally) et GitHub Actions.

## 🛠 Stack Technique

- **Framework :** [Astro](https://astro.build/) (Static Mode)
- **Styling :** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/) (Thème Garden)
- **Données :** Astro Content Collections (Fichiers Markdown locaux)
- **Recherche :** Filtrage dynamique Vanilla JS (Côté client)
- **i18n :** Support natif FR/EN avec structure hybride

## 📖 Comment contribuer ?

À terme, les ajouts se feront via un formulaire public. Pour l'instant, vous pouvez proposer une ressource en créant une Pull Request :

1. Créez un fichier `.md` dans `src/content/ressources/fr/` ou `src/content/ressources/en/`.
2. Respectez le format strict défini dans `src/content/config.ts`.
3. Soumettez votre PR !

## 🏗 Installation Locale

```bash
# Installation des dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

---

*Ce projet est sous licence [MIT](LICENSE).*
