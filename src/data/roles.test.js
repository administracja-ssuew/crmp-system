import { describe, it, expect } from 'vitest';
import { canManage, ROLES, rolesForModule } from './roles';

describe('roles — uprawnienia modułów', () => {
  it('admin zarządza wszystkim', () => {
    for (const m of ['equipment', 'archive', 'map', 'stands', 'nieznany']) {
      expect(canManage(ROLES.ADMIN, m)).toBe(true);
    }
  });
  it('logitech: baza sprzętu i archiwizacja, bez mapy i standów', () => {
    expect(canManage(ROLES.LOGITECH, 'equipment')).toBe(true);
    expect(canManage(ROLES.LOGITECH, 'archive')).toBe(true);
    expect(canManage(ROLES.LOGITECH, 'map')).toBe(false);
    expect(canManage(ROLES.LOGITECH, 'stands')).toBe(false);
  });
  it('promocja: mapa kampusu i rejestr standów, bez sprzętu', () => {
    expect(canManage(ROLES.PROMOCJA, 'map')).toBe(true);
    expect(canManage(ROLES.PROMOCJA, 'stands')).toBe(true);
    expect(canManage(ROLES.PROMOCJA, 'equipment')).toBe(false);
    expect(canManage(ROLES.PROMOCJA, 'archive')).toBe(false);
  });
  it('member i brak roli nie zarządzają niczym', () => {
    for (const role of [ROLES.MEMBER, 'user', null, undefined]) {
      expect(canManage(role, 'map')).toBe(false);
      expect(canManage(role, 'equipment')).toBe(false);
    }
  });
  it('nieznany moduł — tylko admin', () => {
    expect(canManage(ROLES.LOGITECH, 'nieznany')).toBe(false);
  });
  it('sale: tylko admin', () => {
    expect(canManage(ROLES.ADMIN, 'sale')).toBe(true);
    expect(canManage(ROLES.LOGITECH, 'sale')).toBe(false);
    expect(canManage(ROLES.PROMOCJA, 'sale')).toBe(false);
  });
  it('rolesForModule zwraca role modułu, dla nieznanego tylko admin', () => {
    expect(rolesForModule('sale')).toEqual(['admin']);
    expect(rolesForModule('equipment')).toEqual(['admin', 'logitech']);
    expect(rolesForModule('nieznany')).toEqual(['admin']);
  });
});
