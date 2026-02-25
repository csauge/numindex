import fs from 'fs';
import path from 'path';

/**
 * Script de création automatique de ressources pour Salvia.
 * Utilisation : node scripts/add-ressource.mjs '{"title": "Mon Titre", "description": "...", "link": "https://...", "category": "société", "language": "fr", "date": "2026-02-25"}'
 */

const data = JSON.parse(process.argv[2]);

// Slug simple sans dépendance
const slug = data.title
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

const filePath = path.join('src/content/ressources', data.language, `${slug}.md`);

const content = `---
title: "${data.title}"
description: "${data.description}"
link: "${data.link}"
category: "${data.category}"
language: "${data.language}"
date: ${data.date}
---

${data.description}
`;

fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, content);

console.log(`✅ Ressource créée : ${filePath}`);
