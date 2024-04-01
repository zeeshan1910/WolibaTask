<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Company;

class CompanyUserController extends Controller
{

    public function index(Request $request, $companyId)
    {

        $users = User::where('company_id', $companyId)->get();

        return response()->json(['users' => $users]);
    }

    public function search(Request $request, $companyId)
    {

        $users = User::where('company_id', $companyId);


        // Perform the search based on email ID and username
        $searchTerm = $request->get('search');

        $users = $users->where(function ($query) use ($searchTerm) {
            $query->where('email', 'like', "%$searchTerm%")
                ->orWhere('username', 'like', "%$searchTerm%");
        })->get();

        return response()->json(['users' => $users]);
    }

    public function importUser(Request $request, $companyId)
    {
        // Validate incoming request data
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'email' => 'required|email',
        ]);


        // Create new user
        $user = new User();
        $user->username = $request->username;
        $user->email = $request->email;
        $user->password = $request->password;
        $user->company_id = $companyId;
        $user->role = 'user';

        // Add any other user fields as needed
        $user->save();

        return response()->json(['message' => 'User imported successfully'], 201);
    }

    public function update(Request $request, $userId)
    {
        // Retrieve the user by ID
        $user = User::findOrFail($userId);


        // Validate the request data
        $validatedData = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|',
            // Add more validation rules for other fields as needed
        ]);
        
        // Update the user details
        $user->update($validatedData);

        return response()->json(['user' => $user]);
    }

    public function destroy(Request $request, $companyId)
    {

        // Validate the request data
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $users = User::where('company_id', $companyId);
        // Delete the specified users
        $userIds = $request->input('user_ids');
        $users->whereIn('id', $userIds)->delete();

        return response()->json(['message' => 'Users deleted successfully']);
    }

    public function giveAdminAccess(Request $request, $companyId, $userId)
    {
        // Check if the authenticated user is a Super Admin

        // Find the company
        $company = Company::findOrFail($companyId);

        // Decode the JSON string to an array
        $adminsId = json_decode($company->admins_id, true);

        // Check if the user ID already exists in the array
        if (!in_array($userId, $adminsId)) {
            // Add the user ID to the array
            $adminsId[] = intval($userId);

            // Encode the array back to JSON
            $company->admins_id = json_encode($adminsId);

            // Save the updated company
            $company->save();

            return response()->json(['message' => 'Admin access granted successfully'], 200);
        }

        return response()->json(['message' => 'Admin already exists'], 200);
    }
}
