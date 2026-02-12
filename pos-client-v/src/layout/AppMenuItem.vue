<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const { layoutState, isDesktop } = useLayout();
const route = useRoute();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    root: {
        type: Boolean,
        default: true
    },
    parentPath: {
        type: String,
        default: null
    }
});

const normalizePath = (path) => {
    if (!path) return null;
    return path.endsWith('/') ? path.slice(0, -1) : path;
};

const matchesRoute = (path) => {
    const normalized = normalizePath(path);
    if (!normalized) return false;
    const current = normalizePath(route.path);
    return current === normalized || current?.startsWith(`${normalized}/`);
};

const hasActiveChild = (item) => {
    if (!item) return false;
    if (item.to && matchesRoute(item.to)) return true;
    if (item.path && matchesRoute(item.path)) return true;
    if (item.items) {
        return item.items.some((child) => hasActiveChild(child));
    }
    return false;
};

const fullPath = computed(() => {
    if (props.item.path) {
        return props.parentPath ? props.parentPath + props.item.path : props.item.path;
    }
    return props.parentPath;
});

const layoutMatches = computed(() => {
    const activePath = layoutState.activePath;
    if (!activePath) return false;
    if (props.item.items) {
        if (fullPath.value && activePath.startsWith(fullPath.value)) return true;
        return props.item.items?.some((child) => {
            const childPath = child.path ? (fullPath.value ? fullPath.value + child.path : child.path) : null;
            const childTo = child.to;
            return (childPath && activePath.startsWith(childPath)) || (childTo && activePath === childTo);
        });
    }
    if (props.item.to) {
        return activePath === props.item.to;
    }
    if (fullPath.value) {
        return activePath.startsWith(fullPath.value);
    }
    return false;
});

const isActive = computed(() => {
    const routeMatched =
        props.item.items
            ? (props.item.path && matchesRoute(props.item.path)) || hasActiveChild(props.item)
            : props.item.to
            ? matchesRoute(props.item.to)
            : props.item.path
            ? matchesRoute(props.item.path)
            : false;

    return routeMatched || layoutMatches.value;
});

const itemClick = (event, item) => {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    if (item.items) {
        if (isActive.value) {
            layoutState.activePath = null;
        } else {
            layoutState.activePath = fullPath.value || item.to || '/';
        }
        layoutState.menuHoverActive = true;
    } else {
        layoutState.overlayMenuActive = false;
        layoutState.mobileMenuActive = false;
        layoutState.menuHoverActive = false;
    }
};

const onMouseEnter = () => {
    if (isDesktop() && props.root && props.item.items && layoutState.menuHoverActive) {
        layoutState.activePath = fullPath.value;
    }
};
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActive }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">
            <span>{{ item.label }}</span>
        </div>
        <a 
            v-if="(!item.to || item.items) && item.visible !== false" 
            :href="item.url" 
            @click="itemClick($event, item)" 
            :class="['menu-link', item.class, { 'has-submenu': item.items }]" 
            :target="item.target" 
            tabindex="0" 
            @mouseenter="onMouseEnter"
        >
            <span class="menu-icon-wrapper">
                <i :class="item.icon" class="layout-menuitem-icon" />
            </span>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-chevron-down layout-submenu-toggler" v-if="item.items" />
        </a>
        <router-link 
            v-if="item.to && !item.items && item.visible !== false" 
            @click="itemClick($event, item)" 
            exactActiveClass="active-route" 
            :class="['menu-link', item.class]" 
            tabindex="0" 
            :to="item.to" 
            @mouseenter="onMouseEnter"
        >
            <span class="menu-icon-wrapper">
                <i :class="item.icon" class="layout-menuitem-icon" />
            </span>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <span class="active-indicator" v-if="!item.items"></span>
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root || isActive" class="layout-submenu">
                <app-menu-item v-for="child in item.items" :key="child.label + '_' + (child.to || child.path)" :item="child" :root="false" :parentPath="fullPath" />
            </ul>
        </Transition>
    </li>
</template>

<style scoped>
.menu-link {
    position: relative;
}

.menu-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
    background: transparent;
    transition: all 0.2s ease;
}

.menu-link:hover .menu-icon-wrapper {
    background: var(--primary-color);
    transform: scale(1.05);
}

.menu-link:hover .menu-icon-wrapper .layout-menuitem-icon {
    color: white;
}

.menu-link.active-route .menu-icon-wrapper {
    background: var(--primary-color);
}

.menu-link.active-route .menu-icon-wrapper .layout-menuitem-icon {
    color: white;
}

.active-indicator {
    position: absolute;
    right: 0.5rem;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--primary-color);
    display: none;
}

.menu-link.active-route .active-indicator {
    display: block;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.2);
    }
}

.layout-menuitem-root-text {
    position: relative;
    padding-left: 0.5rem;
}

.layout-menuitem-root-text::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 1rem;
    background: var(--primary-color);
    border-radius: 2px;
}

.layout-submenu-toggler {
    transition: transform 0.3s ease;
    font-size: 0.875rem;
}

.active-menuitem > .menu-link .layout-submenu-toggler {
    transform: rotate(180deg);
}

/* Submenu enhancements */
.layout-submenu {
    position: relative;
}

.layout-submenu::before {
    content: '';
    position: absolute;
    left: 1.5rem;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--surface-border);
}

/* Mobile adjustments */
@media (max-width: 991px) {
    .menu-icon-wrapper {
        width: 1.75rem;
        height: 1.75rem;
    }
}
</style>
