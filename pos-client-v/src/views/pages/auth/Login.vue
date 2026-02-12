<script setup>
// import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
// import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useLayout } from '@/layout/composables/layout';
import { ref, onBeforeMount, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import api from '../../../service/api';
import Cookies from 'js-cookie';
const toast = useToast();
const { layoutConfig } = useLayout();
const username = ref('');
const password = ref('');

const login = async () => {
    try {
        const response = await api.post('login', { username: username.value, password: password.value }, { withCredentials: true });
        if (response.status === 200) {
            Cookies.set('access_token', response.data.token);
            Cookies.set('user_id', response.data.user.id);
            Cookies.set('user_name', response.data.user.name);
            Cookies.set('role_id', response.data.user.role.id);
            Cookies.set('role_name', response.data.user.role.name);
            window.location.reload();
        }
    } catch (error) {
        console.error('Login failed:', error);
        
        // Check if error response exists
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'An error occurred';
            
            if (status === 404) {
                // User not found
                toast.add({ 
                    severity: 'error', 
                    summary: 'User Not Found', 
                    detail: message, 
                    life: 3000 
                });
            } else if (status === 401) {
                // Invalid credentials
                toast.add({ 
                    severity: 'error', 
                    summary: 'Authentication Failed', 
                    detail: message, 
                    life: 3000 
                });
            } else if (status === 422) {
                // Validation error
                toast.add({ 
                    severity: 'error', 
                    summary: 'Validation Error', 
                    detail: message, 
                    life: 3000 
                });
            } else {
                // Other server errors
                toast.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: message, 
                    life: 3000 
                });
            }
        } else if (error.request) {
            // Network error - request was made but no response received
            toast.add({ 
                severity: 'error', 
                summary: 'Network Error', 
                detail: 'Unable to connect to the server. Please check your connection.', 
                life: 3000 
            });
        } else {
            // Something else happened
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'An unexpected error occurred. Please try again.', 
                life: 3000 
            });
        }
    }
};
</script>

<template>
    <Toast />
    <!-- <FloatingConfigurator /> -->
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="@/assets/logo.png" alt="NewGenPOS Logo" class="mb-8 w-32 h-32 object-contain mx-auto" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to NewGenPOS!</div>
                        <span class="text-muted-color font-medium">Sign in to continue</span>
                    </div>

                    <div>
                        <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username</label>
                        <InputText id="username" type="text" placeholder="Username" class="w-full md:w-[30rem] mb-8" v-model="username" />

                        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <!-- <div class="flex items-center">
                                <Checkbox v-model="remember" id="remember" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div> -->
                            <!-- <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span> -->
                        </div>
                        <Button label="Sign In" class="w-full" @click="login"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>