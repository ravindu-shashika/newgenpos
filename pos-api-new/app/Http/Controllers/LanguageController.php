<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Translation;
use App\Support\Permissions;
use App\Traits\CacheForget;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

class LanguageController extends Controller
{
    use CacheForget;
    use SpaResponse;

    protected function userCanAccessLanguageSetting(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('language_setting');
    }

    protected function denyLanguageSettingAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect('/dashboard')->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function formatLanguage(Language $language): array
    {
        return [
            'id' => $language->id,
            'language' => $language->language,
            'name' => $language->name,
            'is_default' => (bool) $language->is_default,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessLanguageSetting()) {
            return $this->denyLanguageSettingAccess($request);
        }

        $languages = Language::orderBy('name')->get();
        $defaultLanguage = Language::getDefaultLanguage();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $languages->map(fn (Language $language) => $this->formatLanguage($language)),
                'default_language' => $defaultLanguage ? $this->formatLanguage($defaultLanguage) : null,
            ]);
        }

        return view('vendor.translation.languages.index', compact('languages', 'defaultLanguage'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessLanguageSetting()) {
            return $this->denyLanguageSettingAccess($request);
        }

        $request->validate([
            'language' => 'required|unique:languages,language',
            'name' => 'required|string|max:255',
        ]);

        $language = Language::create([
            'language' => $request->language,
            'name' => $request->name,
        ]);

        Language::forgetCachedLanguage();
        Translation::forgetCachedTranslations();

        $message = 'Language added successfully.';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'data' => $this->formatLanguage($language),
            ], 201);
        }

        return response()->json([
            'success' => $message,
            'language' => $language,
        ]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessLanguageSetting()) {
            return $this->denyLanguageSettingAccess($request);
        }

        $request->validate([
            'name' => 'required|string',
            'language' => 'required|string',
        ]);

        try {
            $language = Language::findOrFail($id);
            $language->update([
                'name' => $request->name,
                'language' => $request->language,
            ]);

            Language::forgetCachedLanguage();
            Translation::forgetCachedTranslations();

            $message = 'Language updated successfully.';

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => $message,
                    'data' => $this->formatLanguage($language->fresh()),
                ]);
            }

            return response()->json(['success' => $message]);
        } catch (\Exception $e) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => 'Failed to update the language. Please try again.',
                ], 500);
            }

            return response()->json(['error' => 'Failed to update the language. Please try again.'], 500);
        }
    }

    public function switchLanguage(Request $request, $id)
    {
        if (!$this->userCanAccessLanguageSetting()) {
            return $this->denyLanguageSettingAccess($request);
        }

        Language::setDefaultLanguage($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => 'Language switched successfully.',
            ]);
        }

        return back()->withSuccess('Language switched successfully');
    }

    public function setDefault(Request $request, $id)
    {
        if (!$this->userCanAccessLanguageSetting()) {
            return $this->denyLanguageSettingAccess($request);
        }

        Language::setDefaultLanguage($id);

        $language = Language::findOrFail($id);
        $message = 'Default language updated.';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'data' => $this->formatLanguage($language),
            ]);
        }

        return response()->json(['success' => $message]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessLanguageSetting()) {
            return $this->denyLanguageSettingAccess($request);
        }

        $language = Language::findOrFail($id);

        if ($language->is_default) {
            $message = 'You can not delete default language!';

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $message], 422);
            }

            return response()->json(['error' => $message], 422);
        }

        Translation::where('locale', $language->language)->delete();

        $language->delete();
        Cache::forget('default_language');
        Language::forgetCachedLanguage();
        Translation::forgetCachedTranslations();

        $message = 'Language deleted successfully.';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return response()->json(['success' => $message]);
    }
}
