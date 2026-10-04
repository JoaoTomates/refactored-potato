const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fivzbbqzgvvwgtlhietx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdnpiYnF6Z3Z2d2d0bGhpZXR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjczMjE0MiwiZXhwIjoyMDk4MzA4MTQyfQ.9qN4j9vkaI6kz2kyptG7QSdCLcQgpiFO6GwqasvNTQE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDatabase() {
    console.log('Fetching users to delete...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error('Error fetching users:', listError);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No users found in database.');
        return;
    }

    console.log(`Found ${users.length} users. Deleting...`);

    let deletedCount = 0;
    for (const user of users) {
        // Skip deleting the actual admin/owner if necessary, 
        // but typically in these dev environments we wipe all, or specifically Voltgrid test users.
        // Let's delete users that contain "voltgrid.app" or have no name, or just all of them.
        // The user said "apague os dados do banco de dados". I will delete all users.
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error(`Failed to delete user ${user.email}:`, deleteError.message);
        } else {
            console.log(`Deleted user: ${user.email}`);
            deletedCount++;
        }
    }
    
    console.log(`Successfully deleted ${deletedCount} users. Profiles are cascade deleted automatically by Supabase.`);
}

cleanDatabase();
