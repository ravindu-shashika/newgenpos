<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppMenu from './AppMenu.vue';

const { layoutState, isDesktop, hasOpenOverlay } = useLayout();
const route = useRoute();
const sidebarRef = ref(null);
let outsideClickListener = null;

watch(
    () => route.path,
    (newPath) => {
        layoutState.activePath = newPath;

        layoutState.overlayMenuActive = false;
        layoutState.mobileMenuActive = false;
        layoutState.menuHoverActive = false;
    },
    { immediate: true }
);

watch(hasOpenOverlay, (newVal) => {
    if (isDesktop()) {
        if (newVal) bindOutsideClickListener();
        else unbindOutsideClickListener();
    }
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener) {
        outsideClickListener = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive = false;
            }
        };

        document.addEventListener('click', outsideClickListener);
    }
};

const unbindOutsideClickListener = () => {
    if (outsideClickListener) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener = null;
    }
};

const isOutsideClicked = (event) => {
    const topbarButtonEl = document.querySelector('.layout-menu-button');

    return !(sidebarRef.value.isSameNode(event.target) || sidebarRef.value.contains(event.target) || topbarButtonEl?.isSameNode(event.target) || topbarButtonEl?.contains(event.target));
};

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});
</script>

<template>
    <aside ref="sidebarRef" class="layout-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
            <div class="logo-container">
                <div class="logo-wrapper">
                    <i class="pi pi-shopping-bag logo-icon"></i>
                </div>
                <div class="logo-text">
                    <h2 class="app-title">NewGen POS</h2>
                    <p class="app-subtitle">Point of Sale System</p>
                </div>
            </div>
        </div>

        <!-- Divider -->
        <div class="sidebar-divider"></div>

        <!-- Menu -->
        <div class="sidebar-content">
            <AppMenu />
        </div>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
            <div class="footer-info">
                <i class="pi pi-info-circle text-sm"></i>
                <span class="footer-text">Version 1.0.0</span>
            </div>
        </div>
    </aside>
</template>

<style scoped>
.sidebar-header {
    padding: 1.5rem 1rem;
    margin-bottom: 0.5rem;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo-wrapper {
    width: 3rem;
    height: 3rem;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.logo-icon {
    color: white;
    font-size: 1.5rem;
}

.logo-text {
    flex: 1;
    min-width: 0;
}

.app-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.app-subtitle {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin: 0.125rem 0 0 0;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--surface-border), transparent);
    margin: 0 1rem 1rem 1rem;
}

.sidebar-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 0.5rem;
}

/* Custom scrollbar for sidebar */
.sidebar-content::-webkit-scrollbar {
    width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
    background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
    background: var(--surface-300);
    border-radius: 10px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
    background: var(--surface-400);
}

.sidebar-footer {
    padding: 1rem;
    border-top: 1px solid var(--surface-border);
    margin-top: auto;
}

.footer-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.75rem;
}

.footer-text {
    font-weight: 500;
}

/* Mobile adjustments */
@media (max-width: 991px) {
    .sidebar-header {
        padding: 1rem;
    }
    
    .logo-wrapper {
        width: 2.5rem;
        height: 2.5rem;
    }
    
    .logo-icon {
        font-size: 1.25rem;
    }
    
    .app-title {
        font-size: 1.125rem;
    }
}
</style>
