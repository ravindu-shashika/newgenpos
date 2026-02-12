<script setup>
import api from '@/service/api';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const toast = useToast();

const form = ref({
    name: '',
    mobile: ''
});

const uploading = ref(false);
const uploadedFiles = ref([]);

async function handleUpload(event) {
    const files = event.files || [];
    if (!files.length) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Please select at least one image.', life: 3000 });
        return;
    }

    if (!form.value.name || !form.value.mobile) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Name and mobile are required.', life: 3000 });
        return;
    }

    uploading.value = true;
    try {
        const formData = new FormData();
        formData.append('name', form.value.name);
        formData.append('mobile', form.value.mobile);
        files.forEach((file) => {
            formData.append('images[]', file);
        });

        const res = await api.post('products/gallery', formData);
        if (res.data?.success) {
            uploadedFiles.value = res.data.files || [];
            toast.add({ severity: 'success', summary: 'Uploaded', detail: 'Images uploaded successfully.', life: 3000 });
        } else {
            throw new Error(res.data?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload failed', error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || error.message || 'Failed to upload images', life: 4000 });
    } finally {
        uploading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4 md:p-6 lg:p-8">
        <div class="card shadow-sm max-w-3xl mx-auto">
            <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-4">Product Gallery Upload</h2>
            <p class="text-surface-500 dark:text-surface-400 mb-6">
                Upload gallery images along with basic contact details. Images are stored for marketing and catalog purposes.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="label">Name</label>
                    <InputText v-model="form.name" class="w-full" placeholder="Enter name" />
                </div>
                <div>
                    <label class="label">Mobile</label>
                    <InputText v-model="form.mobile" class="w-full" placeholder="Enter mobile number" />
                </div>
            </div>

            <div class="upload-panel mb-6">
                <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">Upload Images</h3>
                <FileUpload
                    name="images[]"
                    :auto="false"
                    :customUpload="true"
                    accept="image/*"
                    :multiple="true"
                    :maxFileSize="5 * 1024 * 1024"
                    chooseLabel="Browse"
                    uploadLabel="Upload"
                    cancelLabel="Cancel"
                    class="w-full"
                    @uploader="handleUpload"
                >
                    <template #empty>
                        <div class="text-center text-surface-500 dark:text-surface-300 py-6">
                            Drag and drop images here or click to browse.
                        </div>
                    </template>
                </FileUpload>
            </div>

            <div v-if="uploadedFiles.length" class="mt-6">
                <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-3">Uploaded Files</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div v-for="file in uploadedFiles" :key="file.filename" class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                        <img :src="file.url" :alt="file.filename" class="w-full h-40 object-cover" />
                        <div class="p-3 text-sm text-surface-500 break-all">{{ file.filename }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-card);
    border-radius: 1.25rem;
    border: 1px solid var(--surface-border);
    padding: 1.5rem;
}

.label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--surface-600);
}

.upload-panel {
    border: 1px dashed var(--surface-300);
    border-radius: 1rem;
    padding: 1.5rem;
    background-color: var(--surface-0);
}
</style>
