<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Http\Request;

class MenuController extends Controller
{

    public function index()
    {
        $user = auth()->user();
        if ($user->can('menu.view')) {
            $menus = Menu::all();

            return response()->json([
                'data' => $menus,
                'status' => 200,
            ]);
        } else {
            return response()->json([
                'status' => 403,
                'message' => "You don't have permission to view menus",
            ]);
        }
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->can('menu.save')) {
            $validated = $request->validate([
                'main_menu_icon' => 'nullable|string|max:255',
                'main_menu' => 'required|string|max:255',
                'sub_menu_icon' => 'nullable|string|max:200',
                'sub_menu' => 'required|string|max:255',
                'sub_menu_route' => 'nullable|string|max:200',
                'second_sub_menu_icon' => 'nullable|string|max:200',
                'second_sub_menu' => 'nullable|string|max:255',
                'route' => 'nullable|string|max:255',
                'controller' => 'required|string|max:200',
            ]);

            $menu = Menu::create($validated);

            return response()->json([
                'message' => 'Menu created successfully!',
                'data' => $menu,
                'status' => 200,
            ]);
        } else {
            return response()->json([
                'status' => 403,
                'message' => "You don't have permission to create menus",
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if ($user->can('menu.edit')) {
            $validated = $request->validate([
                'main_menu_icon' => 'nullable|string|max:191',
                'main_menu' => 'nullable|string|max:191',
                'sub_menu_icon' => 'nullable|string|max:191',
                'sub_menu' => 'nullable|string|max:191',
                'sub_menu_route' => 'nullable|string|max:191',
                'second_sub_menu_icon' => 'nullable|string|max:191',
                'second_sub_menu' => 'nullable|string|max:191',
                'route' => 'nullable|string|max:191',
                'controller' => 'nullable|string|max:191',
                'main_menu_order' => 'nullable|integer',
                'sub_menu_order' => 'nullable|integer',
                'child_menu_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
            ]);

            $menu = Menu::findOrFail($id);
            $menu->update($validated);

            return response()->json([
                'message' => 'Menu updated successfully!',
                'data' => $menu,
                'status' => 200,
            ]);
        } else {
            return response()->json([
                'status' => 403,
                'message' => "You don't have permission to update menus",
            ]);
        }
    }



    public function getMenuCurrentRole()
    {
        $user = auth()->user();
        $role_id = $user->role_id;


        $menus = Menu::orderBy('main_menu_order')
            ->orderBy('sub_menu_order')
            ->orderBy('child_menu_order')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $menus,
            'user' => User::find($user->id)
        ]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        if ($user->can('menu.delete')) {
            Menu::findOrFail($id)->delete();
            return response()->json([
                'status' => 200,
                'message' => 'Menu deleted successfully!',
            ]);
        } else {
            return response()->json([
                'status' => 403,
                'message' => "You don't have permission to delete menus",
            ]);
        }
    }
}
