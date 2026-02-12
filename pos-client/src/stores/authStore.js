// stores/authStore.js or authStore.ts
import { defineStore } from "pinia";
import api from "@/service/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    permissions: [],
  }),
  actions: {
    async fetchUser() {
      const res = await api.get("fetch-user-permissions");
      this.user = res.data.user;
      this.permissions = res.data.permissions;

      // console.log("permissions", this.permissions);
    },
    can(permission) {
      return this.permissions.includes(permission);
    },

    // New helper method to check for permissions with wildcards
    canSave(controller) {
      return this.can(`${controller}.save`) || this.can(`${controller}.*`);
    },
    canEdit(controller) {
      return this.can(`${controller}.edit`) || this.can(`${controller}.*`);
    },
    canDelete(controller) {
      return this.can(`${controller}.delete`) || this.can(`${controller}.*`);
    },
    canCancel(controller) {
      return this.can(`${controller}.cancel`) || this.can(`${controller}.*`);
    },
  },
});
