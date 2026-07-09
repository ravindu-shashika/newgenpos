<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('category') ?? $this->input('category_id');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,gif|max:1024',
            'icon' => 'nullable|file|mimetypes:text/plain,image/png,image/jpeg,image/svg+xml|max:1024',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'nullable|boolean',
            'is_sync_disable' => 'nullable|boolean',
            'woocommerce_category_id' => 'nullable|integer',
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories')->ignore($categoryId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'featured' => 'nullable|boolean',
            'page_title' => 'nullable|string|max:255',
            'short_description' => 'nullable|string|max:1000',
        ];
    }
}
