import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const githubToken = process.env.GH_TOKEN_REPO_STATS; // Optionnel mais recommandé

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur: PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseRepoUrl(url) {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.replace(/\/$/, '');
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;

    const owner = segments[0];
    let repo = segments[1];
    if (repo.endsWith('.git')) repo = repo.slice(0, -4);

    if (hostname.includes('github.com')) {
      return { platform: 'github', owner, repo };
    }
    if (hostname.includes('gitlab.com')) {
      return { platform: 'gitlab', owner, repo };
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function fetchGithubStats(owner, repo) {
  const headers = {};
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Dépôt non trouvé');
    if (res.status === 403 || res.status === 429) throw new Error('Limite d\'API atteinte');
    throw new Error(`Erreur API GitHub: ${res.status}`);
  }

  const data = await res.json();
  let versionDate = null;
  
  try {
    // 1. Try to get the latest official release
    const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
    if (relRes.ok) {
      const relData = await relRes.json();
      versionDate = relData.published_at || relData.created_at;
    } else {
      // 2. Fallback: Try to get the latest tag
      const tagsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags`, { headers });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        if (tagsData.length > 0) {
          // We found tags. Now we need to fetch the commit of the latest tag to get its date
          const latestTag = tagsData[0];
          const commitRes = await fetch(latestTag.commit.url, { headers });
          if (commitRes.ok) {
            const commitData = await commitRes.json();
            versionDate = commitData.commit.committer.date || commitData.commit.author.date;
          }
        }
      }
    }
  } catch (e) {
    console.error(`Erreur lors de la récupération de la version pour ${owner}/${repo}:`, e.message);
  }

  // 3. Final fallback: If no release and no tag, use pushed_at (last activity)
  if (!versionDate) {
    versionDate = data.pushed_at;
  }

  return {
    stars: data.stargazers_count,
    versionDate: versionDate ? versionDate.split('T')[0] : null
  };
}

async function fetchGitlabStats(owner, repo) {
  // Simplifié pour l'instant car GitLab nécessite souvent un ID ou une URL encodée
  const projectPath = encodeURIComponent(`${owner}/${repo}`);
  const res = await fetch(`https://gitlab.com/api/v4/projects/${projectPath}`);
  
  if (!res.ok) throw new Error(`Erreur API GitLab: ${res.status}`);
  
  const data = await res.json();
  return {
    stars: data.star_count,
    versionDate: data.last_activity_at ? data.last_activity_at.split('T')[0] : null
  };
}

async function updateRepoStats() {
  console.log('🚀 Démarrage de la mise à jour des stats des dépôts...');

  const { data: resources, error } = await supabase
    .from('resources')
    .select('id, title, metadata')
    .not('metadata->>repository_url', 'is', null);

  if (error) {
    console.error('Erreur Supabase:', error);
    process.exit(1);
  }

  console.log(`${resources.length} ressources avec dépôt trouvées.`);

  let updatedCount = 0;

  for (const res of resources) {
    const repoUrl = res.metadata.repository_url;
    const info = parseRepoUrl(repoUrl);

    if (!info) {
      console.log(`⚠️ URL invalide pour ${res.title}: ${repoUrl}`);
      continue;
    }

    console.log(`Analyse de: ${res.title} (${info.platform}:${info.owner}/${info.repo})...`);

    try {
      let stats;
      if (info.platform === 'github') {
        stats = await fetchGithubStats(info.owner, info.repo);
      } else {
        stats = await fetchGitlabStats(info.owner, info.repo);
      }

      const hasChanged = 
        res.metadata.stars_count !== stats.stars || 
        res.metadata.version_date !== stats.versionDate;

      if (hasChanged) {
        const updatedMetadata = {
          ...res.metadata,
          stars_count: stats.stars,
          version_date: stats.versionDate || res.metadata.version_date
        };

        const { error: updateError } = await supabase
          .from('resources')
          .update({ metadata: updatedMetadata })
          .eq('id', res.id);

        if (updateError) {
          console.error(`❌ Erreur MAJ ${res.title}:`, updateError);
        } else {
          console.log(`✅ Mis à jour: ${res.title} (${stats.stars} ⭐, ${stats.versionDate})`);
          updatedCount++;
        }
      } else {
        console.log(`➖ Déjà à jour: ${res.title}`);
      }
    } catch (e) {
      console.error(`⚠️ Erreur pour ${res.title}:`, e.message);
    }
  }

  console.log(`🏁 Terminé. ${updatedCount} ressource(s) mise(s) à jour.`);
}

updateRepoStats();
