export function combineAuthWithProfiles(users: any[], profiles: any[]) {
  return users.map(u => {
    const p = profiles.find(p => p.id === u.id);
    return {
      id: u.id,
      email: u.email,
      full_name: p?.full_name || null,
      role: p?.role || 'user',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
    };
  });
}
