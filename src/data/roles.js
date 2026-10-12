// Jedno źródło prawdy dla uprawnień ról.
// Rola użytkownika to pole `role` w dokumencie Firestore `authorized_users` (AuthContext → userRole).
//   admin    — pełen dostęp
//   logitech — Baza Sprzętu (panel wydawania /wydawanie) + plan archiwizacji
//   promocja — Mapa Kampusu (zarządzanie + rejestr plakatów) i Rejestr Standów jak admin
//   member   — podstawowy dostęp

export const ROLES = {
  ADMIN: 'admin',
  LOGITECH: 'logitech',
  PROMOCJA: 'promocja',
  MEMBER: 'member',
};

const { ADMIN, LOGITECH, PROMOCJA } = ROLES;

// Które role zarządzają danym modułem (admin zawsze)
export const MODULE_MANAGERS = {
  equipment: [ADMIN, LOGITECH],
  archive: [ADMIN, LOGITECH],
  map: [ADMIN, PROMOCJA],
  stands: [ADMIN, PROMOCJA],
  sale: [ADMIN],
};

export const rolesForModule = (module) => MODULE_MANAGERS[module] ?? [ADMIN];

export const canManage = (role, module) => rolesForModule(module).includes(role);
