import { defineStore } from "pinia";
import axios from "axios";
import api from "../service/api";

export const useRoleStore = defineStore("roleStore", {
  state: () => ({
    roles: [],
    permissions: [],
    menus: [],
  }),

  actions: {
    async fetchRoles() {
      const response = await api.get("roles");
      this.roles = response.data.data;
    },

    async fetchPermissions() {
      const response = await api.get("permissions");
      this.permissions = response.data.data;
    },

    async fetchMenuByRole() {
      const response = await api.get("menus/current-role");
      return response.data.data;
    },

    async createRole(roleName) {
      await api.post("roles", { name: roleName });
      this.fetchRoles();
    },

    async createPermission(permissionName) {
      const response = await api.post("permissions", { name: permissionName });
      await this.fetchPermissions();
      return response;
    },

    async assignPermissions(roleId, permissions) {
      const response = await api.post(`roles/${roleId}/assign-permissions`, {
        permissions,
      });
      await this.fetchRoles();
      return response;
      // this.fetchRoles();
    },

    async getRolePermissions(roleId) {
      try {
        const response = await api.get(`roles/${roleId}/permissions`);
        return response.data;
      } catch (error) {
        console.error("Error fetching permissions for role:", error);
        return [];
      }
    },
  },
});
