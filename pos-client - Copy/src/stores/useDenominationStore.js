// stores/useDenominationStore.js
import { defineStore } from "pinia";
import api from "../service/api";
import Cookies from "js-cookie";

export const useDenominationStore = defineStore("denomination", {
  state: () => ({
    isActive: false,
    showWarning: false,
    warningRedirectCallback: null,
  }),
  actions: {
    async checkActive() {
      console.log("checking active denomination:");
      try {
        const response = await api.post("check-active-denomination", {
          branch_id: Cookies.get("user_branch"),
          transaction_date: Cookies.get("system_date"),
        });
        console.log("checking active denomination:", response.data);
        this.isActive = response.data.check_status;
        this.showWarning = this.isActive;
        return this.isActive;
      } catch (err) {
        console.error("Error checking active denomination:", err);
        this.isActive = false;
        this.showWarning = false;
        return false;
      }
    },
  },
});
